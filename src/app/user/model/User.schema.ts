import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { createHash, randomBytes } from "crypto";
import { Document } from "mongoose";

export type UserDocument = User & Document;

function generateClientSeed() {
	// Using a crypto library to generate a random string
	return createHash('sha256').update(randomBytes(256)).digest('hex');
}
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

	@Prop({ default: generateClientSeed() })
	clientSeed: string;

	@Prop({ default: Date.now() })
	createdAt: Date;

	@Prop({ default: Date.now() })
	updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);