import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { FlightGoModule } from '../integrations/flightgo/flightgo.module';

@Module({
  imports: [FlightGoModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
