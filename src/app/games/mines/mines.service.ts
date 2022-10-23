import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Game } from './model/Game.schema';
import { UserDocument } from '../../user/model/User.schema';
import { generateServerSeeds, generateTiles } from '../util';

@Injectable()
export class MineService {
	constructor(@InjectModel(Game.name) private readonly GameModel: Model<Game>) { }

	async findGameById (id: string) {
		const game = await this.GameModel.findById(id);

		if ( !game ) {
			return null;
		}

		return game;
	}
	
	async findGameByUser (User: UserDocument, select: string) {
		const game = await this.GameModel.findOne({ user: User._id, status: 'in_progress' }, select).sort({ nonce: -1 }).lean();

		if (!game) {
			return null;
		}

		return game;
	}

	async createGame (clientSeed: string, nonce: number, deposit: number, mineCount: number, User: UserDocument) {
		const { serverSeed, serverSeedHash } = generateServerSeeds();

		const Game = await this.GameModel.create({
				serverSeed: serverSeed,
				serverSeedHash: serverSeedHash,
				clientSeed: clientSeed,
				nonce: nonce,
				bets: [{ user: User._id, deposit: deposit }],
				info: {
					mineCount: mineCount,
					minePositions: generateTiles(serverSeed, clientSeed, nonce, 0, mineCount),
					tilesTurned: []
				},
				status: 'in_progress',
				user: User._id,
		});

		return { serverSeedHash, clientSeed, nonce: Game.nonce, bets: Game.bets, info: { tilesTurned: [] }, status: Game.status };
	}

	async getLastGameNonce(User: UserDocument) {
		const game = await this.GameModel.findOne({ user: User._id, status: 'in_progress' }, 'nonce').sort({ nonce: -1 });

		if (!game) {
			return -1;
		}

		return game.nonce;
  }

	async uncoverTile (User: UserDocument, tile: number) {
		// Get game 
		const Game = await this.findGameByUser(User, '');

		// Check if tile is already uncovered
		if (Game.info.tilesTurned.includes(tile)) {
			return { status: Game.status, info: { tilesTurned: Game.info.tilesTurned } };
		}

		// Check if tile is a mine
		if (Game.info.minePositions.includes(tile)) {
			// Update game status
			Game.status = 'lost';
		}

		// Add tile to tilesTurned
		Game.info.tilesTurned.push(tile);

		// Update game
		await this.GameModel.updateOne({ _id: Game._id }, { $set: { status: Game.status, info: Game.info } });

		return { status: Game.status, info: { tilesTurned: Game.info.tilesTurned, minePositions: Game.status === 'lost' ? Game.info.minePositions : [] } };
	}

	async updateGameStatus(_id: Types.ObjectId, status: string) {
		await this.GameModel.findByIdAndUpdate(_id, { status });
  }

	calculatePayout (deposit: number, mineCount: number, tilesTurned: number) {
		// Increase the payout based on how many tiles have turned, and multiply this by a factor based on the mine count, round to 2 decimal places
		const payout = deposit * (1 + (tilesTurned / 5) * (mineCount / 3.75))
		return Math.round(payout * 100) / 100;
	}
}