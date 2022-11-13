import { RouletteDocument, RouletteGame } from './../model/Roulette.schema';
import { UserDocument } from '../../user/model/User.schema';
import { Model, PopulatedDoc, Types } from 'mongoose';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { generateServerSeeds } from '../mines/mines.util';

@Injectable()
export class RouletteService {
	constructor(private readonly httpService: HttpService, @InjectModel(RouletteGame.name) private readonly GameModel: Model<RouletteGame>) { }

	async createGame(): Promise<RouletteDocument> {

		const { serverSeed, serverSeedHash, publicSeed } = this.fetchSeeds();

		const lastNonce = await this.GameModel.findOne().sort({ nonce: -1 }).select('nonce');

		return await this.GameModel.create({
			players: [],
			publicSeed,
			serverSeed,
			serverSeedHash,
			isCurrentGame: true,
			status: 'WAITING_FOR_PLAYERS',
			roll: null,
			nonce: lastNonce ? lastNonce.nonce + 1 : 0,
		});
	}

	async getActiveGame(): Promise<RouletteDocument> {
		return await this.GameModel.findOne({ isCurrentGame: true, status: 'WAITING_FOR_PLAYERS' });
	}

	async addPlayer(gameId: Types.ObjectId, user: Partial<UserDocument>, bet: number, color: string): Promise<RouletteDocument> {
		const game = await this.GameModel.findOne({ _id: gameId, isCurrentGame: true, status: 'WAITING_FOR_PLAYERS' });
		
		if(!game) {
			throw new Error('Game not found');
		}

		game.players.push({ user: { _id: user._id, username: user.username, avatar: user.avatar }, bet, color });
		
		await this.GameModel.updateOne({ _id: gameId }, { $set: { players: game.players } });
		

		return game;
	}

	async rollGame(gameId: Types.ObjectId): Promise<RouletteDocument> {
		const game = await this.GameModel.findOne({ _id: gameId, isCurrentGame: true, status: 'WAITING_FOR_PLAYERS' });

		const roll = this.generateRouletteTicket(game.serverSeed, game.publicSeed, game.nonce);

		game.roll = roll;
		game.status = 'FINISHED';
		game.isCurrentGame = false;

		await game.save();

		return game;
	}

	async payoutGame (gameId: Types.ObjectId): Promise<any[]> {
		const game = await this.GameModel.findOne({ _id: gameId, isCurrentGame: false, status: 'FINISHED' });

		const winningColor = game.roll % 2 === 0 ? 'red' : 'black';

		const winnings = [];
		let totalPayout = 0;
		// For each player in the game, if their color matches the winning color, payout x2 for red or black, or x14 for green
		game.players.forEach(player => {
			const payout = player.color === 'green' ? player.bet * 14 : player.bet * 2;

			if(player.color === winningColor) {
				totalPayout += payout;
				
				// Check if the player is already in winnings
				const playerIndex = winnings.findIndex(winner => winner.user._id.toString() === player.user._id.toString());

				if(playerIndex === -1) {
					winnings.push({ user: player.user, payout });
				} else {
					winnings[playerIndex].payout += payout;
				}
			}
		});

		game.payout = totalPayout;

		await game.save();

		return winnings;
	}

	generateRouletteTicket(serverSeed, publicSeed, round): number {
		const hash = createHash('sha256').update(`${serverSeed}:${publicSeed}:${round}`).digest('hex');
		return parseInt(hash.substring(0, 8), 16) % 15;
	}

	fetchSeeds (): { serverSeed: string, serverSeedHash: string, publicSeed: string } {
		const { serverSeed, serverSeedHash } = generateServerSeeds();

		// Generate a concatenation of 6 pairs of random numbers, 00 to 39
		const publicSeed = Array.from({ length: 6 }, () => Math.floor(Math.random() * 40).toString().padStart(2, '0')).join('');

		return { serverSeed, serverSeedHash, publicSeed };
	}
}