import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEmail, IsEnum, Min } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  franchiseId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class WalletRechargeDto {
  @IsString()
  companyId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateWalletLimitDto {
  @IsString()
  companyId!: string;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;
}

export class CreateFranchiseDto {
  @IsString()
  companyId!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateBranchDto {
  @IsString()
  franchiseId!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────
  // Users Directory
  // ─────────────────────────────────────────────────────

  async getUsers(requestingRole: UserRole, requestingCompanyId?: string) {
    const select = {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      companyId: true,
      franchiseId: true,
      branchId: true,
      company: { select: { name: true, code: true } },
      franchise: { select: { name: true, code: true } },
      branch: { select: { name: true, code: true } },
    };

    if (requestingRole === UserRole.SUPER_ADMIN) {
      return this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select,
      });
    }

    if (requestingRole === UserRole.COMPANY_ADMIN && requestingCompanyId) {
      return this.prisma.user.findMany({
        where: { companyId: requestingCompanyId },
        orderBy: { createdAt: 'desc' },
        select,
      });
    }

    throw new ForbiddenException('Insufficient permissions to list users');
  }

  async toggleUserStatus(adminRole: UserRole, targetUserId: string) {
    if (adminRole !== UserRole.SUPER_ADMIN && adminRole !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only admins can update user status');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent disabling super admins from non-super admins
    if (user.role === UserRole.SUPER_ADMIN && adminRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify super admin accounts');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────
  // Companies + Wallet Management
  // ─────────────────────────────────────────────────────

  async getCompanies(role: UserRole, companyId?: string) {
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.company.findMany({
        include: {
          wallets: { select: { balance: true, currency: true }, take: 1 },
          _count: { select: { franchises: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if ((role === UserRole.COMPANY_ADMIN || role === UserRole.FRANCHISE_ADMIN) && companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          wallets: { select: { balance: true, currency: true }, take: 1 },
          _count: { select: { franchises: true } },
        },
      });
      return company ? [company] : [];
    }

    throw new ForbiddenException('Access denied');
  }

  async rechargeWallet(adminRole: UserRole, dto: WalletRechargeDto) {
    if (adminRole !== UserRole.SUPER_ADMIN && adminRole !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only admins can recharge wallets');
    }

    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const wallet = await this.prisma.wallet.upsert({
      where: { companyId: dto.companyId },
      update: { balance: { increment: dto.amount } },
      create: {
        companyId: dto.companyId,
        balance: dto.amount,
        currency: 'INR',
      },
    });

    return {
      companyId: dto.companyId,
      companyName: company.name,
      newBalance: wallet.balance,
      currency: wallet.currency,
      recharged: dto.amount,
    };
  }

  // ─────────────────────────────────────────────────────
  // Hierarchy: Franchises + Branches
  // ─────────────────────────────────────────────────────

  async getFranchises(role: UserRole, companyId?: string, franchiseId?: string) {
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.franchise.findMany({
        include: {
          company: { select: { name: true, code: true } },
          _count: { select: { branches: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if ((role === UserRole.COMPANY_ADMIN) && companyId) {
      return this.prisma.franchise.findMany({
        where: { companyId },
        include: {
          company: { select: { name: true, code: true } },
          _count: { select: { branches: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === UserRole.FRANCHISE_ADMIN && franchiseId) {
      const franchise = await this.prisma.franchise.findUnique({
        where: { id: franchiseId },
        include: {
          company: { select: { name: true, code: true } },
          _count: { select: { branches: true, users: true } },
        },
      });
      return franchise ? [franchise] : [];
    }

    throw new ForbiddenException('Access denied');
  }

  async getBranches(role: UserRole, companyId?: string, franchiseId?: string, branchId?: string) {
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.branch.findMany({
        include: {
          franchise: { include: { company: { select: { name: true } } } },
          _count: { select: { users: true, shipments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === UserRole.COMPANY_ADMIN && companyId) {
      return this.prisma.branch.findMany({
        where: { franchise: { companyId } },
        include: {
          franchise: { include: { company: { select: { name: true } } } },
          _count: { select: { users: true, shipments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === UserRole.FRANCHISE_ADMIN && franchiseId) {
      return this.prisma.branch.findMany({
        where: { franchiseId },
        include: {
          franchise: { include: { company: { select: { name: true } } } },
          _count: { select: { users: true, shipments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === UserRole.BRANCH_STAFF && branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          franchise: { include: { company: { select: { name: true } } } },
          _count: { select: { users: true, shipments: true } },
        },
      });
      return branch ? [branch] : [];
    }

    throw new ForbiddenException('Access denied');
  }

  // ─────────────────────────────────────────────────────
  // Global Stats
  // ─────────────────────────────────────────────────────

  async createFranchise(role: UserRole, dto: CreateFranchiseDto) {
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only admins can create franchises');
    }
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    // Check unique code within company
    const existing = await this.prisma.franchise.findUnique({
      where: { companyId_code: { companyId: dto.companyId, code: dto.code } },
    });
    if (existing) throw new BadRequestException(`Franchise code "${dto.code}" already exists in this company`);

    return this.prisma.franchise.create({
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
      },
      include: {
        company: { select: { name: true, code: true } },
        _count: { select: { branches: true, users: true } },
      },
    });
  }

  async createBranch(role: UserRole, dto: CreateBranchDto) {
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.COMPANY_ADMIN &&
      role !== UserRole.FRANCHISE_ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions to create branches');
    }
    const franchise = await this.prisma.franchise.findUnique({ where: { id: dto.franchiseId } });
    if (!franchise) throw new NotFoundException('Franchise not found');

    return this.prisma.branch.create({
      data: {
        franchiseId: dto.franchiseId,
        code: dto.code,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        phone: dto.phone,
        email: dto.email,
      },
      include: {
        franchise: { include: { company: { select: { name: true } } } },
        _count: { select: { users: true, shipments: true } },
      },
    });
  }

  async getGlobalStats(role: UserRole, companyId?: string) {
    if (role === UserRole.SUPER_ADMIN) {
      const [userCount, companyCount, franchiseCount, branchCount, shipmentCount, walletSum] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.company.count(),
          this.prisma.franchise.count(),
          this.prisma.branch.count(),
          this.prisma.shipment.count(),
          this.prisma.wallet.aggregate({ _sum: { balance: true } }),
        ]);

      return {
        users: userCount,
        companies: companyCount,
        franchises: franchiseCount,
        branches: branchCount,
        shipments: shipmentCount,
        totalWalletBalance: walletSum._sum.balance || 0,
      };
    }

    if (companyId) {
      const [userCount, franchiseCount, branchCount, shipmentCount] = await Promise.all([
        this.prisma.user.count({ where: { companyId } }),
        this.prisma.franchise.count({ where: { companyId } }),
        this.prisma.branch.count({ where: { franchise: { companyId } } }),
        this.prisma.shipment.count({ where: { branch: { franchise: { companyId } } } }),
      ]);

      const wallet = await this.prisma.wallet.findUnique({ where: { companyId } });

      return {
        users: userCount,
        companies: 1,
        franchises: franchiseCount,
        branches: branchCount,
        shipments: shipmentCount,
        totalWalletBalance: wallet?.balance || 0,
      };
    }

    throw new ForbiddenException('Access denied');
  }

  // ─────────────────────────────────────────────────────
  // Create User
  // ─────────────────────────────────────────────────────

  async createUser(requestingRole: UserRole, requestingCompanyId: string | undefined, dto: CreateUserDto) {
    // Permission check
    if (requestingRole === UserRole.BRANCH_STAFF) {
      throw new ForbiddenException('Branch staff cannot create users');
    }
    if (requestingRole === UserRole.FRANCHISE_ADMIN && dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Franchise admin cannot create super admins');
    }
    if (requestingRole === UserRole.COMPANY_ADMIN && dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Company admin cannot create super admins');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('A user with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hashedPassword,
        role: dto.role,
        companyId: dto.companyId || requestingCompanyId || null,
        franchiseId: dto.franchiseId || null,
        branchId: dto.branchId || null,
        isActive: true,
      },
      select: {
        id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
        companyId: true, franchiseId: true, branchId: true,
        company: { select: { name: true, code: true } },
        franchise: { select: { name: true, code: true } },
        branch: { select: { name: true, code: true } },
      },
    });

    return user;
  }

  // ─────────────────────────────────────────────────────
  // Analytics
  // ─────────────────────────────────────────────────────

  async getAnalytics(role: UserRole, companyId?: string, franchiseId?: string, branchId?: string) {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);

    // Build shipment where clause based on role
    let shipmentWhere: any = {
      createdAt: { gte: startOfDay(thirtyDaysAgo), lte: endOfDay(today) },
    };

    if (role === UserRole.COMPANY_ADMIN && companyId) {
      shipmentWhere.branch = { franchise: { companyId } };
    } else if (role === UserRole.FRANCHISE_ADMIN && franchiseId) {
      shipmentWhere.branch = { franchiseId };
    } else if (role === UserRole.BRANCH_STAFF && branchId) {
      shipmentWhere.branchId = branchId;
    }
    // SUPER_ADMIN gets all (no extra filter)

    // Fetch all shipments in date range with selected rates
    const shipments = await this.prisma.shipment.findMany({
      where: shipmentWhere,
      include: {
        rates: {
          where: { isSelected: true },
          include: { partner: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build per-day bookings and revenue map (last 30 days)
    const dayMap = new Map<string, { bookings: number; revenue: number }>();
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(today, 29 - i), 'MMM d');
      dayMap.set(d, { bookings: 0, revenue: 0 });
    }

    // Carrier breakdown map
    const carrierMap = new Map<string, number>();

    for (const s of shipments) {
      const dayKey = format(new Date(s.createdAt), 'MMM d');
      if (dayMap.has(dayKey)) {
        const entry = dayMap.get(dayKey)!;
        entry.bookings += 1;
        const selectedRate = s.rates[0];
        if (selectedRate) {
          entry.revenue += selectedRate.totalAmount;
        }
      }
      const partnerName = s.rates[0]?.partner?.name || 'Unknown';
      carrierMap.set(partnerName, (carrierMap.get(partnerName) || 0) + 1);
    }

    const chartData = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      bookings: v.bookings,
      revenue: Math.round(v.revenue * 100) / 100,
    }));

    const carrierBreakdown = Array.from(carrierMap.entries()).map(([name, count]) => ({ name, count }));

    // Recent shipments (last 10)
    const recentShipments = shipments.slice(-10).reverse().map(s => ({
      id: s.id,
      awbNo: s.awbNo,
      toCountry: s.toCountry,
      toCity: s.toCity,
      weight: s.weight,
      status: s.status,
      carrier: s.rates[0]?.partner?.name || 'N/A',
      totalAmount: s.rates[0]?.totalAmount || 0,
      createdAt: s.createdAt,
    }));

    const totalRevenue = shipments.reduce((sum, s) => sum + (s.rates[0]?.totalAmount || 0), 0);

    return {
      chartData,
      carrierBreakdown,
      recentShipments,
      summary: {
        totalShipments: shipments.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        daysRange: 30,
      },
    };
  }
}
