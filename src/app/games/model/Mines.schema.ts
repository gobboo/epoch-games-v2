import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type MinesDocument = MinesGame & Document;

@Schema()
export class MinesGame {
    
    @Prop()
    user: Types.ObjectId;

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

export const MinesSchema = SchemaFactory.createForClass(MinesGame);