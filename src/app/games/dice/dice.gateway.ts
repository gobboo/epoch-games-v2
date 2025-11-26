import { WsGuard } from '../events.guard';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { UserDocument } from '../../user/model/User.schema';
import { UserService } from 'src/app/user/user.service';
import { DiceService } from './dice.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DiceGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly DiceService: DiceService, private readonly UserService: UserService ) { }

  @UseGuards(WsGuard)
  @SubscribeMessage('dice:create')
  async createGame(@MessageBody() data: { buyIn: number, maxPlayers: number }, @ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    if (!data) return { success: false, message: 'Invalid data.' };
    
    const { buyIn, maxPlayers } = data;
    
    if (buyIn < 2) return { success: false, message: 'Buy-In amount must be between 2 - 10000.' };

    if (maxPlayers < 2 || maxPlayers > 8) return { success: false, message: 'Invalid max players, you can only have 2 - 8.' };
    console.log(buyIn);
    // Check if user has the balance for their buy-in
    const canAfford = await this.UserService.canAfford(client.user, buyIn);
    if (!canAfford) return { success: false, message: 'You do not have enough funds to create this game.' };

    await this.UserService.updateBalance(client.user._id, buyIn * -1);

    // Create the game
    const game = await this.DiceService.createGame(buyIn, maxPlayers, client.user);
    
    // Join the game? ( private rooms )
    const gameInfo = {
      _id: game._id,
      buyIn: game.buyIn,
      maxPlayers: game.maxPlayers,
      players: [{ user: { id: client.user._id, username: client.user.username, avatar: client.user.avatar, clientSeed: client.user.clientSeed }, roll: 0 }],
      status: game.status,
      creator: { _id: client.user._id, username: client.user.username }
    }

    client.broadcast.emit('dice:created', gameInfo);

    return { success: true, message: 'Game created successfully.', game: gameInfo };
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('dice:join')
  async joinGame(@MessageBody() data: { gameId: string }, @ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    if (!data) return { success: false, message: 'Invalid data.' };
    
    const { gameId } = data;

    const game = await this.DiceService.findGameById(gameId);

    if (!game) return { success: false, message: 'Could not find a game with this ID.' };
    if (game.status !== 'open') return { success: false, message: 'This Game is currently in-progress.' };
    if (game.players.length >= game.maxPlayers) return { success: false, message: 'The game you\'re trying to join is full.' };
    
    // Check to see if we're already in the game
    const alreadyInGame = game.players.find(player => client.user._id.equals(player.user['_id']));
    if (alreadyInGame) return { success: false, message: 'You\'re already in this game.' };

    // Check if user has the balance for their buy-in
    const canAfford = await this.UserService.canAfford(client.user, game.buyIn);
    if (!canAfford) return { success: false, message: 'You do not have enough funds to join this game.' };

    await this.UserService.updateBalance(client.user._id, game.buyIn * -1);
    
    this.server.emit('dice:joined', { _id: gameId, user: { _id: client.user._id, username: client.user.username, avatar: client.user.avatar, clientSeed: client.user.clientSeed } });
    // Join the game
    const updatedGame = await this.DiceService.joinGame(gameId, client.user);

    if (updatedGame.status === 'finished') {
      // Game was won
      this.server.emit('dice:finished', updatedGame);

      await this.UserService.updateBalance(updatedGame.winner.toString(), updatedGame.buyIn * updatedGame.players.length);

      return { success: true, message: 'Game finished successfully.', game: updatedGame };
    }

    return { success: true, message: 'Game joined successfully.', game: updatedGame };
  }
}
