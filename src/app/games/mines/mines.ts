// import { MineService } from './mines.service';
// import { UserService } from 'src/app/user/user.service';

// import { createHash, randomBytes, createHmac } from "crypto";
// import { flatten, chunk } from "lodash";
// import { Injectable } from '@nestjs/common';
// import { User, UserDocument } from 'src/app/user/model/User.schema';

// @Injectable()
// export class MinesLogic {
// 	maxTiles: number;
// 	mineCount: number;
// 	minePositions: number[] = [];
// 	turnedTiles: number[] = [];
// 	serverSeed: string;
// 	serverSeedHash: string;
// 	clientSeed: string;
// 	nonce: number;
// 	deposit: number;
// 	status: string;
// 	user: UserDocument;
// 	game: string;

//   constructor(private readonly MineService: MineService, private readonly UserService: UserService, clientSeed: string) {
// 		this.clientSeed = clientSeed;

// 		this.status = 'in_progress';
// 		this.maxTiles = 25;
// 		this.user = null;
// 	}

// 	/* Setters */
// 	public setDeposit(deposit: number) {
// 		this.deposit = deposit;

// 		return this;
// 	}

// 	public setMineCount(mineCount: number) {
// 		this.mineCount = mineCount;

// 		return this;
// 	}

// 	public setMaxTiles(maxTiles: number) {
// 		this.maxTiles = maxTiles;

// 		return this;
// 	}

// 	public setGameOwner(user: UserDocument) {
// 		this.user = user;

// 		return this;
// 	}

// 	public async createGame() {
// 		await this.UserService.updateBalance(this.user, -this.deposit);

// 		this.generateTiles();

// 		// Get nonce from last game
// 		const lastGame = await this.MineService.findGameByUser(this.user._id);

// 		if (lastGame) {
// 			this.nonce = lastGame.nonce + 1;
// 		}

// 		// Create a new Game in the Database
// 		await this.MineService.createGame({
// 			serverSeed: this.serverSeed,
// 			serverSeedHash: this.serverSeedHash,
// 			clientSeed: this.clientSeed,
// 			nonce: this.nonce,
// 			bets: [{ user: this.user.username, deposit: this.deposit }],
// 			info: {
// 				mineCount: this.mineCount,
// 				minePositions: this.minePositions,
// 				tilesTurned: []
// 			},
// 			status: 'in_progress',
// 			user: this.user._id,
// 		})

// 		// Return the Game ID to the Player
// 		await this.load();

// 		return this;
// 	}

// 	public async uncoverTile(tile: number) {
// 		await this.MineService.uncoverTile(this.user._id, this.nonce, tile);
		
// 		this.turnedTiles.push(tile);

// 		if (this.minePositions.includes(tile)) {
// 			// Player Lost
// 			this.status = 'lost';

// 			await this.MineService.updateStatus(this.user._id, this.nonce, 'lost');
// 		}

// 		// Check if all tiles are uncovered except for the mines
// 		if (this.minePositions.length === this.maxTiles - 1) {
// 			this.status = 'won';

// 			await this.MineService.updateStatus(this.user._id, this.nonce, 'won');
// 		}

// 		return this;
// 	}

// 	public generateServerSeeds() {
// 		const serverSeed = randomBytes(16).toString('hex');
// 		const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

// 		this.serverSeed = serverSeed;
// 		this.serverSeedHash = serverSeedHash;

// 		return this;
// 	}

// 	public async cashout() {
// 		// First check if the user didn't touch any mines

// 		this.turnedTiles.forEach((tile) => {
// 			if (this.minePositions.includes(tile)) {
// 				return false;
// 			}
// 		});

// 		// Add Winnings to Players Balance
// 		this.UserService.updateBalance(this.user, this.calculateWinnings());

// 		// Update Game Status
// 		this.status = 'cashed_out';

// 		 this.MineService.updateStatus(this.user._id, this.nonce, 'cashed_out');

// 		return true;
// 	}

// 	public calculateWinnings() {
// 		// Create a small multiplier based on the amount of tiles uncovered and how many mines there were
// 		const multiplier = (this.turnedTiles.length / this.maxTiles) * (this.mineCount / this.maxTiles);

// 		// Calculate the winnings based on the multiplier
// 		const winnings = this.deposit * (1 + multiplier);

// 		return winnings;
// 	}
// }
