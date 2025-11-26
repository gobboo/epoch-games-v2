import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/app/user/user.module';
import { RouletteSchema } from '../model/Roulette.schema';
import { RouletteGateway } from './roulette.gateway';
import { RouletteService } from './roulette.service';

@Module({
	imports: [
		HttpModule,
		MongooseModule.forFeature([
			{ name: 'RouletteGame', schema: RouletteSchema }
		]),
		UserModule
	],
	providers: [RouletteGateway, RouletteService],
	exports: []
})

export class RouletteModule { }