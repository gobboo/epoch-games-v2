import { Module } from '@nestjs/common';
import { DiceModule } from './dice/dice.module';
import { MineModule } from './mines/mines.module';
import { RouletteModule } from './roulette/roulette.module';

@Module({
  imports: [MineModule, DiceModule, RouletteModule],
  controllers: [],
  providers: []
})
export class EventsModule { }
