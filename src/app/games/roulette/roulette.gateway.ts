import { UserService } from 'src/app/user/user.service';
import { RouletteService } from './roulette.service';
import { WsGuard } from '../events.guard';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { UserDocument } from '../../user/model/User.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RouletteGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly RouletteService: RouletteService, private readonly UserService: UserService) { }

  @UseGuards(WsGuard)
  @SubscribeMessage('roulette:join')
  async joinGame(@MessageBody() data: { deposit: number, color: string }, @ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    const { deposit, color } = data;

    const activeGame = await this.RouletteService.getActiveGame();

    if (!activeGame) {
      return { success: false, message: 'There is already a round in progress.' };
    }

    if (deposit <= 0 || deposit > client.user.balance) {
      return { success: false, message: 'You do not have enough balance for this bet.' };
    }

    if (color !== 'red' && color !== 'black' && color !== 'green') {
      return { success: false, message: 'Invalid Bet Selection.' };
    }

    // Take the deposit from the user
    await this.UserService.updateBalance(client.user._id, -deposit);

    const game = await this.RouletteService.addPlayer(activeGame._id, client.user, deposit, color);

    this.server.emit('roulette:joined', { _id: game._id, user: { _id: client.user._id, username: client.user.username, avatar: client.user.avatar }, bet: deposit, color });

    return { success: true, message: 'You have joined the game.' };
  }

  afterInit(server: Server) {
    setInterval(async () => {

      // Check if there is an active game
      let activeGame = await this.RouletteService.getActiveGame();
      console.log('Looking for active game');
      if (!activeGame) {
        // If there is no active game, create one
        activeGame = await this.RouletteService.createGame();
        console.log('Created new game');
      }

      const timeNow = Date.now();

      const timeUntilStart = 10000 + timeNow;

      setTimeout(async () => {
        const updatedGame = await this.RouletteService.rollGame(activeGame._id);
        const winnings = await this.RouletteService.payoutGame(updatedGame._id);

        winnings.forEach(async (player) => {
          await this.UserService.updateBalance(player.user._id, player.payout);
        });

        server.emit('roulette:ended', { _id: updatedGame._id, roll: updatedGame.roll, nonce: updatedGame.nonce, players: updatedGame.players, serverSeed: updatedGame.serverSeed, serverSeedHash: updatedGame.serverSeedHash, publicSeed: updatedGame.publicSeed });
      }, timeUntilStart - timeNow);


      server.emit('roulette:new', { _id: activeGame._id, roll: activeGame.roll, nonce: activeGame.nonce, players: activeGame.players, serverSeedHash: activeGame.serverSeedHash, publicSeed: activeGame.publicSeed, timeUntilStart });
    }, 15050);
  }
}
