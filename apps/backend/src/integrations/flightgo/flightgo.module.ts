import { Module } from '@nestjs/common';
import { FlightGoService } from './flightgo.service';

@Module({
  providers: [FlightGoService],
  exports: [FlightGoService],
})
export class FlightGoModule {}
