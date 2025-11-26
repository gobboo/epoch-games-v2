import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forRootAsync({
		imports: [],
		useFactory: async () => ({
			uri: process.env.MONGO_URI
		}),
		inject: []
	})],
	controllers: [],
	providers: [],
})
export class DatabaseModule { }
