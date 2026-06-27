import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEmail, IsEnum, Min } from 'class-validator';

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
}
