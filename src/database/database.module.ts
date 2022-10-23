import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forRootAsync({
		imports: [],
		useFactory: async () => ({
			uri: 'mongodb://localhost:27017/nest'
		}),
		inject: []
	})],
	controllers: [],
	providers: [],
})
export class DatabaseModule { }
