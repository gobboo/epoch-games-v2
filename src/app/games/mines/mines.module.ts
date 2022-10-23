import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../../user/user.module";
import { MineGateway } from "./mines.gateway";
import { MineService } from "./mines.service";
import { GameSchema } from "./model/Game.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Game', schema: GameSchema }
		]),
		UserModule
	],
	providers: [MineGateway, MineService],
	exports: [MineService]
})

export class MineModule { }