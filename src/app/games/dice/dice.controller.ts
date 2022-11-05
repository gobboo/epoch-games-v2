import {
	Controller,
	Get
} from '@nestjs/common';
import { DiceService } from './dice.service';

@Controller('dice')
export class DiceController {

	constructor(private readonly DiceService: DiceService) { }

	@Get('all')
	async getActiveGames(): Promise<any> {
		const games = await this.DiceService.findAllGames();

		return games;
	}
}