import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { FlightGoModule } from '../integrations/flightgo/flightgo.module';
import { DhlModule } from '../integrations/dhl/dhl.module';

@Module({
  imports: [FlightGoModule, DhlModule],
  controllers: [RatesController],
  providers: [RatesService],
})
export class RatesModule {}
