import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { FlightGoModule } from '../integrations/flightgo/flightgo.module';

@Module({
  imports: [FlightGoModule],
  controllers: [RatesController],
  providers: [RatesService],
})
export class RatesModule {}
