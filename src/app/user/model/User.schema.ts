import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User {

	@Prop()
	username: string;

	@Prop()
	email: string;

	@Prop()
	avatar: string;

	@Prop({ default: 0, required: false })
	role: string;

	@Prop({ default: 0, required: false })
	balance: number;

	@Prop({ type: Object })
	discord: {
		id: string;
		avatar: string;
		discriminator: string;
		verified: boolean;
	}

	@Prop({ type: Object })
	google: {
		id: string;
		avatar: string;
	}

	@Prop({ type: Object })
	steam: {
		id: string;
		avatar: string;
	}

	@Prop()
	clientSeed: string;

	@Prop({ default: Date.now() })
	createdAt: Date;

	@Prop({ default: Date.now() })
	updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);