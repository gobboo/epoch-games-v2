import { Module } from '@nestjs/common';
import { MineModule } from './mines/mines.module';

@Module({
  imports: [MineModule],
  controllers: [],
  providers: []
})
export class EventsModule { }
