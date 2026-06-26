import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShipmentsService, BookShipmentDto } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private shipmentsService: ShipmentsService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Get current company wallet balance' })
  getWallet(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string
  ) {
    return this.shipmentsService.getWalletBalance(userId, role, companyId);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book a shipping label and deduct wallet balance' })
  bookShipment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId: string | null,
    @CurrentUser('branchId') branchId: string | null,
    @Body() dto: BookShipmentDto
  ) {
    return this.shipmentsService.bookShipment(userId, role, companyId, branchId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all shipments filtered by organizational roles' })
  getShipments(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId: string | null,
    @CurrentUser('franchiseId') franchiseId: string | null,
    @CurrentUser('branchId') branchId: string | null
  ) {
    return this.shipmentsService.getShipments(userId, role, companyId, franchiseId, branchId);
  }
}
