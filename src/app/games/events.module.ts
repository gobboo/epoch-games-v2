import { Module } from '@nestjs/common';
import { DiceModule } from './dice/dice.module';
import { MineModule } from './mines/mines.module';

@Module({
  imports: [MineModule, DiceModule],
  controllers: [],
  providers: []
})
export class EventsModule { }
