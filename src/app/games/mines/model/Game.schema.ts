import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GameDocument = Game & Document;

@Schema()
export class Game {
    
    @Prop()
    user: string;

    @Prop()
    game: string;

    @Prop()
    serverSeed: string;

    @Prop()
    serverSeedHash: string;

    @Prop()
    clientSeed: string;

    @Prop()
    nonce: number;

    @Prop()
    bets: [{
        user: string,
        deposit: number
    }]

    @Prop({ type: Object })
    info: {
        mineCount: number,
        minePositions: number[],
        tilesTurned: number[]
    }

    @Prop()
    status: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);