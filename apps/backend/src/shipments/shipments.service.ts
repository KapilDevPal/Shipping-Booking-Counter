import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import PDFDocument from 'pdfkit';

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

      // Generate AWB
      const awbNo = `FG-${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Create Shipment
      let shipment = await tx.shipment.create({
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
          labelUrl: '', // Will update next
          bookedAt: new Date(),
          branchId: branchId!,
          createdById: userId,
        },
      });

      // Update with the correct relative labelUrl using its ID
      const labelUrl = `/api/shipments/${shipment.id}/label`;
      shipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: { labelUrl },
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

  async generatePdfLabel(shipmentId: string): Promise<Buffer> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        branch: {
          include: {
            franchise: {
              include: {
                company: true,
              },
            },
          },
        },
        rates: {
          where: { isSelected: true },
          include: { partner: true },
        },
      },
    });

    if (!shipment) {
      throw new BadRequestException('Shipment not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A6', margin: 15 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Draw label border
      doc.rect(5, 5, doc.page.width - 10, doc.page.height - 10).stroke();

      // Branding Header
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0b86fc').text('FLIGHTGO EXPRESS', 15, 15);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('INTERNATIONAL AIR WAYBILL', 15, 28);
      
      // Divider
      doc.moveTo(5, 40).lineTo(doc.page.width - 5, 40).stroke();

      // Mock Barcode block (Very cool!)
      doc.fillColor('#000000');
      let xOffset = 30;
      const barcodeWidths = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 3, 2, 2, 1, 4, 1, 2];
      for (const w of barcodeWidths) {
        doc.rect(xOffset, 50, w, 28).fill();
        xOffset += w + 2;
      }
      
      // AWB text under barcode
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(shipment.awbNo || 'PENDING', 15, 83, { align: 'center', width: doc.page.width - 30 });

      // Divider
      doc.moveTo(5, 98).lineTo(doc.page.width - 5, 98).stroke();

      // SHIP FROM (Left) & SHIP TO (Right)
      const colWidth = (doc.page.width - 40) / 2;
      
      // From info
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text('SHIP FROM:', 15, 105);
      const branchName = shipment.branch?.name || 'FlightGo Branch';
      const companyName = shipment.branch?.franchise?.company?.name || 'FlightGo Corp';
      doc.fontSize(7).font('Helvetica').text(companyName, 15, 116, { width: colWidth });
      doc.text(branchName, 15, 125, { width: colWidth });
      doc.text(`${shipment.fromCity || ''}, ${shipment.fromState || ''}`, 15, 134, { width: colWidth });
      doc.text(`PIN: ${shipment.fromPincode || '-'}`, 15, 143, { width: colWidth });

      // To info
      const rightColX = 15 + colWidth + 10;
      doc.fontSize(8).font('Helvetica-Bold').text('SHIP TO:', rightColX, 105);
      doc.fontSize(7).font('Helvetica').text(shipment.toCountry || 'Destination Country', rightColX, 116, { width: colWidth });
      doc.text(shipment.toCity || 'Zone Standard', rightColX, 125, { width: colWidth });
      if (shipment.toState) {
        doc.text(shipment.toState, rightColX, 134, { width: colWidth });
      }
      doc.text(`ZIP: ${shipment.toZipcodeId || '-'}`, rightColX, 143, { width: colWidth });

      // Divider
      doc.moveTo(5, 160).lineTo(doc.page.width - 5, 160).stroke();

      // SHIPMENT SPECIFICATIONS
      doc.fontSize(8).font('Helvetica-Bold').text('SHIPMENT DETAILS:', 15, 166);
      
      const partnerName = shipment.rates?.find(r => r.isSelected)?.serviceName || 'FlightGo Express Standard';
      doc.fontSize(7).font('Helvetica').text(`Carrier & Service: ${partnerName}`, 15, 177);
      doc.text(`Package Type: ${shipment.packageType}`, 15, 186);
      doc.text(`Transit Mode: ${shipment.shipmentType}`, 15, 195);
      doc.text(`Actual Weight: ${shipment.weight} kg`, 15, 204);
      doc.text(`Volumetric Weight: ${shipment.volumetricWeight || '0.0'} kg`, 15, 213);
      
      // Dimensions
      const dims = `${shipment.length || 0} x ${shipment.width || 0} x ${shipment.height || 0} cm`;
      doc.text(`Dimensions (LxWxH): ${dims}`, 15, 222);

      // Booked date
      const bookedDateStr = shipment.bookedAt
        ? new Date(shipment.bookedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
        : new Date(shipment.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
      doc.text(`Booked At: ${bookedDateStr} IST`, 15, 231);

      // Divider
      doc.moveTo(5, 245).lineTo(doc.page.width - 5, 245).stroke();

      // ADD-ON SERVICES
      doc.fontSize(7).font('Helvetica-Bold').text('SPECIAL INSTRUCTIONS / OPTIONS:', 15, 250);
      const options: string[] = [];
      if (shipment.signatureRequired) options.push('Signature Required');
      if (shipment.specialHandling) options.push('Special Handling');
      if (shipment.insurance) options.push('Insured Cover');
      if (shipment.nonStandardGoods) options.push('Non-Standard');
      
      const optionsText = options.length > 0 ? options.join(', ') : 'None';
      doc.fontSize(7).font('Helvetica').text(optionsText, 15, 260, { width: doc.page.width - 30 });

      if (shipment.remarks) {
        doc.fontSize(7).font('Helvetica-Bold').text('Remarks:', 15, 275);
        doc.font('Helvetica-Oblique').text(`"${shipment.remarks}"`, 15, 283, { width: doc.page.width - 30 });
      }

      // Bottom footer / signature line
      doc.moveTo(5, 335).lineTo(doc.page.width - 5, 335).stroke();
      doc.fontSize(6).font('Helvetica').fillColor('#64748b').text('Declaration: The shipper certifies that the details of this airwaybill are correct and that the shipment does not contain any dangerous goods.', 15, 342, { width: doc.page.width - 30 });

      doc.end();
    });
  }
}
