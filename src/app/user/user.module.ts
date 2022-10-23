import { MongooseModule } from '@nestjs/mongoose';
import { Module } from "@nestjs/common";
import { UserSchema } from './model/User.schema';
import { UserService } from './user.service';

@Module({
	imports: [
		MongooseModule
			.forFeature([
				{ name: 'User', schema: UserSchema }
			])
	],
	providers: [UserService],
	exports: [UserService]
})

export class UserModule { }