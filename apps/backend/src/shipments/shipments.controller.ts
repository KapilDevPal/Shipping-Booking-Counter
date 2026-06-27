import { Controller, Get, Post, Patch, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShipmentsService, BookShipmentDto } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Get(':id/label')
  @ApiOperation({ summary: 'Download AWB PDF shipping label' })
  async downloadLabel(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.shipmentsService.generatePdfLabel(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel/void a shipment booking and refund company wallet' })
  cancelShipment(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string
  ) {
    return this.shipmentsService.cancelShipment(id, role, companyId);
  }
}
