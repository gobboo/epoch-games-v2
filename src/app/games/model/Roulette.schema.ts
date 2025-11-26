import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Date, Document, Types } from "mongoose";

export type RouletteDocument = RouletteGame & Document;

@Schema()
export class RouletteGame {

    @Prop()
    roll: number;

    @Prop()
    nonce: number;

    @Prop({ type: Object })
    players: [
        {
            user: {
                _id: Types.ObjectId,
                username: string,
                avatar: string
            },
            bet: number,
            color: string
        }
    ]

    @Prop()
    payout: number;

    @Prop()
    isCurrentGame: boolean;

    @Prop({ enum: ['WAITING_FOR_PLAYERS', 'FINISHED'] })
    status: string;

    @Prop()
    serverSeed: string;

    @Prop()
    serverSeedHash: string;

    @Prop()
    publicSeed: string;
}

export const RouletteSchema = SchemaFactory.createForClass(RouletteGame);