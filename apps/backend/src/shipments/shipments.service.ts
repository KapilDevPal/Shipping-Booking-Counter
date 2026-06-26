import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export class BookShipmentDto {
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsEnum(['DOCUMENT', 'PARCEL'])
  packageType!: 'DOCUMENT' | 'PARCEL';

  @IsEnum(['EXPRESS', 'SURFACE'])
  shipmentType!: 'EXPRESS' | 'SURFACE';

  @IsNumber()
  @Min(0.1)
  weight!: number;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  volumetricWeight?: number;

  @IsString()
  toCountry!: string;

  @IsOptional()
  @IsString()
  toZipcodeId?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsString()
  toState?: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  fromState?: string;

  @IsOptional()
  @IsString()
  fromPincode?: string;

  @IsOptional()
  @IsString()
  shipDate?: string;

  @IsOptional()
  @IsBoolean()
  signatureRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  specialHandling?: boolean;

  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @IsOptional()
  @IsBoolean()
  nonStandardGoods?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;

  // Selected Rate
  @IsString()
  partnerCode!: string;

  @IsString()
  partnerName!: string;

  @IsString()
  serviceCode!: string;

  @IsString()
  serviceName!: string;

  @IsNumber()
  rate!: number;

  @IsNumber()
  tax!: number;

  @IsNumber()
  totalAmount!: number;

  @IsOptional()
  @IsNumber()
  transitDays?: number;
}

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async getWalletBalance(userId: string, role: UserRole, companyId?: string) {
    if (!companyId) {
      // Super admins do not belong to a specific company
      if (role === UserRole.SUPER_ADMIN) {
        return { balance: 999999, currency: 'INR' };
      }
      throw new BadRequestException('User does not belong to a company');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { companyId },
    });

    if (!wallet) {
      // Auto-create wallet if missing
      const newWallet = await this.prisma.wallet.create({
        data: {
          companyId,
          balance: 10000.0,
          currency: 'INR',
        },
      });
      return { balance: newWallet.balance, currency: newWallet.currency };
    }

    return { balance: wallet.balance, currency: wallet.currency };
  }

  async bookShipment(userId: string, role: UserRole, companyId: string | null, branchId: string | null, dto: BookShipmentDto) {
    if (role !== UserRole.BRANCH_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only counter staff or super admins can book shipments');
    }

    if (!branchId) {
      // Try to find a fallback branch for Super Admin or mock
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) throw new BadRequestException('No branches configured in system');
      branchId = firstBranch.id;
    }

    // Resolve company for wallet check
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
      // If super admin, find the first company
      const branchInfo = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: { franchise: true },
      });
      resolvedCompanyId = branchInfo?.franchise.companyId || null;
    }

    if (!resolvedCompanyId) {
      throw new BadRequestException('Cannot determine company wallet for booking');
    }

    // 1. Transaction: Validate and deduct wallet, then create shipment
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { companyId: resolvedCompanyId! },
      });

      if (!wallet || wallet.balance < dto.totalAmount) {
        throw new BadRequestException('Insufficient wallet balance to book shipment');
      }

      // Deduct wallet balance
      await tx.wallet.update({
        where: { companyId: resolvedCompanyId! },
        data: { balance: { decrement: dto.totalAmount } },
      });

      // Find partner ID or create if missing
      let partner = await tx.courierPartner.findUnique({
        where: { code: dto.partnerCode },
      });

      if (!partner) {
        partner = await tx.courierPartner.create({
          data: {
            code: dto.partnerCode,
            name: dto.partnerName,
            isActive: true,
          },
        });
      }

      // Generate AWB and Mock Label PDF URL
      const awbNo = `FG-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const labelUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;

      // Create Shipment
      const shipment = await tx.shipment.create({
        data: {
          referenceNo: dto.referenceNo,
          status: 'BOOKED',
          packageType: dto.packageType,
          shipmentType: dto.shipmentType,
          weight: dto.weight,
          length: dto.length,
          width: dto.width,
          height: dto.height,
          volumetricWeight: dto.volumetricWeight,
          toCountry: dto.toCountry,
          toZipcodeId: dto.toZipcodeId,
          toCity: dto.toCity,
          toState: dto.toState,
          fromCity: dto.fromCity,
          fromState: dto.fromState,
          fromPincode: dto.fromPincode,
          shipDate: dto.shipDate ? new Date(dto.shipDate) : new Date(),
          signatureRequired: dto.signatureRequired || false,
          specialHandling: dto.specialHandling || false,
          insurance: dto.insurance || false,
          nonStandardGoods: dto.nonStandardGoods || false,
          remarks: dto.remarks,
          awbNo,
          labelUrl,
          bookedAt: new Date(),
          branchId: branchId!,
          createdById: userId,
        },
      });

      // Create ShipmentRate entry
      const shipmentRate = await tx.shipmentRate.create({
        data: {
          shipmentId: shipment.id,
          partnerId: partner.id,
          serviceCode: dto.serviceCode,
          serviceName: dto.serviceName,
          rate: dto.rate,
          tax: dto.tax,
          totalAmount: dto.totalAmount,
          currency: 'INR',
          transitDays: dto.transitDays,
          isSelected: true,
        },
      });

      return {
        ...shipment,
        rate: shipmentRate,
      };
    });
  }

  async getShipments(userId: string, role: UserRole, companyId: string | null, franchiseId: string | null, branchId: string | null) {
    // Filter shipments by organizational hierarchy
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.shipment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { rates: { where: { isSelected: true }, include: { partner: true } } },
      });
    }

    if (role === UserRole.COMPANY_ADMIN && companyId) {
      return this.prisma.shipment.findMany({
        where: {
          branch: {
            franchise: {
              companyId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { rates: { where: { isSelected: true }, include: { partner: true } } },
      });
    }

    if (role === UserRole.FRANCHISE_ADMIN && franchiseId) {
      return this.prisma.shipment.findMany({
        where: {
          branch: {
            franchiseId,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { rates: { where: { isSelected: true }, include: { partner: true } } },
      });
    }

    if (role === UserRole.BRANCH_STAFF && branchId) {
      return this.prisma.shipment.findMany({
        where: {
          branchId,
        },
        orderBy: { createdAt: 'desc' },
        include: { rates: { where: { isSelected: true }, include: { partner: true } } },
      });
    }

    return [];
  }
}
