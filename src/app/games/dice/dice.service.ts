import { UserDocument } from './../../user/model/User.schema';
import { Model, PopulatedDoc, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateServerSeeds } from '../mines/mines.util';
import { createHash } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { DiceGame } from './../model/DiceDuel.schema';

@Injectable()
export class DiceService {
	constructor(private readonly httpService: HttpService, @InjectModel(DiceGame.name) private readonly GameModel: Model<DiceGame>) { }

	async createGame(buyIn: number, maxPlayers: number, user: Partial<UserDocument>) {
		// Generate Server Seed
		const { serverSeed, serverSeedHash } = generateServerSeeds();

		const lastNonce = await this.GameModel.findOne().sort({ nonce: -1 });

		const game = await this.GameModel.create({
			buyIn: buyIn,
			maxPlayers: maxPlayers,
			players: [{ user: { _id: user._id, username: user.username, avatar: user.avatar, clientSeed: user.clientSeed }, roll: 0 }],
			status: 'open',
			creator: user._id,
			serverSeed: serverSeed,
			serverSeedHash: serverSeedHash,
			nonce: lastNonce ? lastNonce.nonce + 1 : 0
		});

		return game;
	}

	async findGameById(id: string) {
		const game = await this.GameModel.findById(id)
			.populate('creator', 'username avatar clientSeed');

		if (!game) {
			return null;
		}

		return game;
	}

	async findAllGames() {
		const games = await this.GameModel.find({ status: 'open' })
			.populate('creator', '_id username avatar clientSeed');

		return games;
	}

	async joinGame(gameId: string, user: Partial<UserDocument>) {
		const game = await this.GameModel.findById(gameId)
			.populate('creator', 'username avatar clientSeed');

		if (!game) {
			return null;
		}

		if (game.players.length >= game.maxPlayers) {
			return null;
		}

		game.players.push({ user: { _id: user._id, username: user.username, avatar: user.avatar, clientSeed: user.clientSeed }, roll: 0 });

		if (game.players.length === game.maxPlayers) {
			// Last Player joined, so now we run the game, fetching the next EOS block
			const { hash, number, timestamp } = await this.fetchNextBlock(new Date());

			game.block = {
				hash,
				number,
				timestamp
			};

			// Generate a ticket for each player
			game.players.forEach((player, index) => {				
				player.roll = this.generateTicket(game.serverSeed, game.block.hash, player.user.clientSeed, game.nonce, index);
			});

			// Sort the players by their ticket
			game.status = 'finished';

			// Find the winner
			const winner = game.players.reduce((prev, current) => (prev.roll > current.roll) ? prev : current).user as Partial<UserDocument>;

			game.winner = winner._id;
			
		}

		await this.GameModel.updateOne({ _id: gameId }, game);

		return game;
	}

	fetchNextBlock(timeNow: Date): Promise<{ hash: string, number: number, timestamp: number }> {
		// Fetch an EOS Block from an API that was created after the timeNow and return its hash
		return new Promise((resolve) => {
			setTimeout(() => {
				// Check the current Head Block Number and it's time, if it's after the timeNow, return the hash, else repeat
				this.httpService.get('https://bp.cryptolions.io/v1/chain/get_info').toPromise().then((response) => {
					const blockTime = new Date(response.data.head_block_time);
					console.log(blockTime, timeNow);
					if (blockTime > timeNow) {
						resolve({ hash: response.data.head_block_id, number: response.data.head_block_num, timestamp: response.data.head_block_time });
					} else {
						resolve(this.fetchNextBlock(timeNow));
					}
				});
			}, 1000);
		});
	}

	generateTicket(serverSeed: string, blockId: string, clientSeed: string, nonce: number, position: number) {
		const hash = createHash('sha256').update(`${serverSeed}:${blockId}:${clientSeed}:${nonce}:${position}"`).digest('hex');

		return parseInt(hash.substring(0, 8), 16) % 10000;
	}
}