import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../../user/user.module";
import { DiceSchema } from "../model/DiceDuel.Schema";
import { DiceController } from "./dice.controller";
import { DiceGateway } from "./dice.gateway";
import { DiceService } from "./dice.service";

@Module({
	imports: [
		HttpModule,
		MongooseModule.forFeature([
			{ name: 'DiceGame', schema: DiceSchema }
		]),
		UserModule
	],
	providers: [DiceGateway, DiceService],
	controllers: [
		DiceController
	],
	exports: [DiceService]
})

export class DiceModule { }