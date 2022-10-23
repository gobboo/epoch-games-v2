import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './app/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './app/games/events.module';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: ['src/config/.env.local', 'src/config/.env'],
  }), DatabaseModule, AuthModule, EventsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
