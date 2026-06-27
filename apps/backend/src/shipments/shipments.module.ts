import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FlightGoModule } from '../integrations/flightgo/flightgo.module';
import { DhlModule } from '../integrations/dhl/dhl.module';

@Module({
  imports: [PrismaModule, FlightGoModule, DhlModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
