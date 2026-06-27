import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService, WalletRechargeDto } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics' })
  getStats(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string,
  ) {
    return this.adminService.getGlobalStats(role, companyId);
  }

  // ── Users ──────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all users (scoped by role)' })
  getUsers(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string,
  ) {
    return this.adminService.getUsers(role, companyId);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active/inactive status' })
  toggleUserStatus(
    @CurrentUser('role') role: UserRole,
    @Param('id') targetUserId: string,
  ) {
    return this.adminService.toggleUserStatus(role, targetUserId);
  }

  // ── Companies ──────────────────────────────────────────
  @Get('companies')
  @ApiOperation({ summary: 'List companies with wallet balances' })
  getCompanies(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string,
  ) {
    return this.adminService.getCompanies(role, companyId);
  }

  @Post('wallet/recharge')
  @ApiOperation({ summary: 'Recharge company wallet balance' })
  rechargeWallet(
    @CurrentUser('role') role: UserRole,
    @Body() dto: WalletRechargeDto,
  ) {
    return this.adminService.rechargeWallet(role, dto);
  }

  // ── Franchises ─────────────────────────────────────────
  @Get('franchises')
  @ApiOperation({ summary: 'List franchises (scoped by role)' })
  getFranchises(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string,
    @CurrentUser('franchiseId') franchiseId?: string,
  ) {
    return this.adminService.getFranchises(role, companyId, franchiseId);
  }

  // ── Branches ───────────────────────────────────────────
  @Get('branches')
  @ApiOperation({ summary: 'List branches (scoped by role)' })
  getBranches(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('companyId') companyId?: string,
    @CurrentUser('franchiseId') franchiseId?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.adminService.getBranches(role, companyId, franchiseId, branchId);
  }
}
