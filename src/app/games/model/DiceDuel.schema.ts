import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Date, Document, Types } from "mongoose";

export type MinesDocument = DiceGame & Document;

@Schema()
export class DiceGame {
    
    @Prop({ type: Types.ObjectId, ref: 'User' })
    creator: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    winner: Types.ObjectId;

    @Prop()
    nonce: number;

    @Prop()
    buyIn: number;

    @Prop()
    maxPlayers: number;

    @Prop({ type: Object })
    players: [
        {
            user: {
                _id: Types.ObjectId,
                username: string,
                avatar: string,
                clientSeed: string
            },
            roll: number
        }
    ]

    @Prop()
    status: string;

    @Prop()
    serverSeed: string;

    @Prop()
    serverSeedHash: string;

    @Prop({ type: Object })
    block: {
        hash: string,
        number: number,
        timestamp: number
    };
}

export const DiceSchema = SchemaFactory.createForClass(DiceGame);