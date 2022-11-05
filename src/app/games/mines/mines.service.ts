import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MinesGame } from '../model/Mines.schema';
import { UserDocument } from '../../user/model/User.schema';
import { generateServerSeeds, generateTiles } from './mines.util';

@Injectable()
export class MineService {
	constructor(@InjectModel(MinesGame.name) private readonly GameModel: Model<MinesGame>) { }

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

		const MinesGame = await this.GameModel.create({
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

		return { serverSeedHash, clientSeed, nonce: MinesGame.nonce, bets: MinesGame.bets, info: { tilesTurned: [] }, status: MinesGame.status };
	}

	async getLastGameNonce(User: UserDocument) {
		const game = await this.GameModel.findOne({ user: User._id }, 'nonce').sort({ nonce: -1 });

		if (!game) {
			return -1;
		}

		return game.nonce;
  }

	async uncoverTile (User: UserDocument, tile: number) {
		// Get game 
		const MinesGame = await this.findGameByUser(User, '');

		// Check if tile is already uncovered
		if (MinesGame.info.tilesTurned.includes(tile)) {
			return { status: MinesGame.status, info: { tilesTurned: MinesGame.info.tilesTurned } };
		}

		// Check if tile is a mine
		if (MinesGame.info.minePositions.includes(tile)) {
			// Update game status
			MinesGame.status = 'lost';
		}

		// Add tile to tilesTurned
		MinesGame.info.tilesTurned.push(tile);

		// Update game
		await this.GameModel.updateOne({ _id: MinesGame._id }, { $set: { status: MinesGame.status, info: MinesGame.info } });

		return { status: MinesGame.status, info: { tilesTurned: MinesGame.info.tilesTurned, minePositions: MinesGame.status === 'lost' ? MinesGame.info.minePositions : [] } };
	}

	async updateGameStatus(_id: Types.ObjectId, status: string) {
		await this.GameModel.findByIdAndUpdate(_id, { status });
  }

	calculatePayout (deposit: number, mineCount: number, tilesTurned: number) {
		// Increase the payout based on how many tiles have turned, and multiply this by a factor based on the mine count, round to 2 decimal places
		const payout = deposit * (1 + (tilesTurned / 5) * (mineCount / 3))
		return Math.round(payout * 100) / 100;
	}
}