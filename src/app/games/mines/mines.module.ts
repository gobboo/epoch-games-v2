import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../../user/user.module";
import { MineGateway } from "./mines.gateway";
import { MineService } from "./mines.service";
import { MinesSchema } from "../model/Mines.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MinesGame', schema: MinesSchema }
		]),
		UserModule
	],
	providers: [MineGateway, MineService],
	exports: [MineService]
})

export class MineModule { }