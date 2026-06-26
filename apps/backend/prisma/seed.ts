import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { code: 'CO1' },
    update: {},
    create: {
      code: 'CO1',
      name: 'Flightgo India Pvt Ltd',
      gstin: '27AAAAA1111A1Z1',
      address: '123 Main Street, Mumbai',
      phone: '+919999999999',
      email: 'hq@flightgo.com',
      logoUrl: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=200&h=200&q=80',
    },
  });
  console.log(`Seeded company: ${company.name}`);

  // Create Wallet for Company
  const wallet = await prisma.wallet.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      balance: 100000.0,
      currency: 'INR',
    },
  });
  console.log(`Seeded wallet with balance: ${wallet.balance} for company ${company.name}`);

  // 2. Create Franchise
  const franchise = await prisma.franchise.upsert({
    where: { companyId_code: { companyId: company.id, code: 'FR1' } },
    update: {},
    create: {
      companyId: company.id,
      code: 'FR1',
      name: 'Goa Premium Franchise',
      address: 'Panaji Highway, Goa',
      phone: '+918888888888',
      email: 'goa@flightgo.com',
    },
  });
  console.log(`Seeded franchise: ${franchise.name}`);

  // 3. Create Branch
  const branch = await prisma.branch.create({
    data: {
      franchiseId: franchise.id,
      code: 'BR1',
      name: 'Panaji Central Branch',
      address: 'Near Bus Stand, Panaji',
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
      phone: '+917777777777',
      email: 'panaji@flightgo.com',
    },
  });
  console.log(`Seeded branch: ${branch.name}`);

  // 4. Create Courier Partners
  const courierPartners = [
    { code: 'FLIGHTGO', name: 'FlightGo Express' },
    { code: 'DHL', name: 'DHL International Express' },
    { code: 'FEDEX', name: 'FedEx Priority' },
    { code: 'ARAMEX', name: 'Aramex Cargo' },
  ];

  for (const partner of courierPartners) {
    const cp = await prisma.courierPartner.upsert({
      where: { code: partner.code },
      update: {},
      create: {
        code: partner.code,
        name: partner.name,
        isActive: true,
      },
    });
    console.log(`Seeded courier partner: ${cp.name}`);
  }

  // 5. Create Users
  const saltRounds = 10;
  const users = [
    {
      email: 'superadmin@flightgo.com',
      name: 'Flightgo Admin',
      role: UserRole.SUPER_ADMIN,
      password: 'admin123',
    },
    {
      email: 'companyadmin@flightgo.com',
      name: 'Company Director',
      role: UserRole.COMPANY_ADMIN,
      password: 'company123',
      companyId: company.id,
    },
    {
      email: 'franchiseadmin@flightgo.com',
      name: 'Franchise Partner',
      role: UserRole.FRANCHISE_ADMIN,
      password: 'franchise123',
      companyId: company.id,
      franchiseId: franchise.id,
    },
    {
      email: 'branchstaff@flightgo.com',
      name: 'Panaji Counter Staff',
      role: UserRole.BRANCH_STAFF,
      password: 'counter123',
      companyId: company.id,
      franchiseId: franchise.id,
      branchId: branch.id,
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, saltRounds);
    const u = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        companyId: user.companyId,
        franchiseId: user.franchiseId,
        branchId: user.branchId,
        isActive: true,
      },
    });
    console.log(`Seeded user: ${u.email} (${u.role})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
