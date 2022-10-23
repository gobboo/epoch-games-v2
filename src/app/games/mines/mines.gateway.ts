import { Game } from './model/Game.schema';
import { WsGuard } from './../events.guard';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { MineService } from './mines.service';
import { UserDocument } from '../../user/model/User.schema';
import { UserService } from 'src/app/user/user.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MineGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly MineService: MineService, private readonly UserService: UserService ) { }

  @UseGuards(WsGuard)
  @SubscribeMessage('mine:create')
  async createGame(@MessageBody() data: number[], @ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    if (!data) return;

    const [deposit, mineCount] = data;

    if (mineCount < 1 || mineCount > 24) return { error: 'Invalid Mine Count' };
    
    // Check for an existing game
    const mine = await this.MineService.findGameByUser(client.user, '-info.minePositions -serverSeed');

    if (mine) {
      return mine;
    }

    // Check to see if User has enough balance
    if (!this.UserService.canAfford(client.user, deposit)) {
      return { success: false, message: 'You don\'t have the funds for this Game.' };
    }

    const lastGameNonce = await this.MineService.getLastGameNonce(client.user);

    // Take the users balance
    await this.UserService.updateBalance(client.user, -deposit);

    const Game = await this.MineService.createGame(client.user.clientSeed, lastGameNonce + 1, deposit, mineCount, client.user);

    return Game;
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('mine:reveal')
  async turnTile(@MessageBody() tile: number, @ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    const mine = await this.MineService.findGameByUser(client.user, '-info.minePositions -serverSeed');

    if (!mine) {
      return null;
    }

    // Turn the Games Tile
    const updatedGame = await this.MineService.uncoverTile(client.user, tile);

    // Check if the game is over
    return { ...updatedGame, potentialWin: this.MineService.calculatePayout(mine.bets[0].deposit, mine.info.mineCount, updatedGame.info.tilesTurned.length) };
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('mine:cashout')
  async cashoutGame(@ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    const mine = await this.MineService.findGameByUser(client.user, '-serverSeed');

    // Check if the game is over
    if (mine.status !== 'in_progress') {
      return false;
    }

    // Make sure that no mines have been uncovered
    if (mine.info.tilesTurned.some((tile) => mine.info.minePositions.includes(tile))) {
      return false;
    }

    // Calculate the payout
    const payout = this.MineService.calculatePayout(mine.bets[0].deposit, mine.info.mineCount, mine.info.tilesTurned.length);

    // Update the users balance
    await this.UserService.updateBalance(client.user, payout);

    // Update the game status
    await this.MineService.updateGameStatus(mine._id, 'cashed_out');

    // Check if the game is over
    return { ...mine, potentialWin: this.MineService.calculatePayout(mine.bets[0].deposit, mine.info.mineCount, mine.info.tilesTurned.length) };
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('mine:fetch')
  async checkGame(@ConnectedSocket() client: Socket & { user: UserDocument }): Promise<any> {
    // Check for an existing game
    const mine = await this.MineService.findGameByUser(client.user, '-info.minePositions -serverSeed');

    if (!mine) {
      return null;
    }

    // Return an existing game
    return { ...mine, potentialWin: this.MineService.calculatePayout(mine.bets[0].deposit, mine.info.mineCount, mine.info.tilesTurned.length) };
  }
}
