import { PrismaClient, UserRole, ProjectStatus, ContractStatus, BoqStatus, IpcStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.ipcQuantity.deleteMany();
  await prisma.ipcVerification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ipcPayment.deleteMany();
  await prisma.boqApproval.deleteMany();
  await prisma.boqItem.deleteMany();
  await prisma.extensionOfTime.deleteMany();
  await prisma.variationOrder.deleteMany();
  await prisma.contractAmendment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.projectProgress.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create roles
  await prisma.role.createMany({
    data: [
      { name: 'SUPER_ADMIN', description: 'Full system access' },
      { name: 'DIRECTOR', description: 'Director level access' },
      { name: 'PROJECT_MANAGER', description: 'Project management access' },
      { name: 'CONTRACT_ENGINEER', description: 'Contract engineering access' },
      { name: 'CONSULTANT', description: 'Consultant access' },
      { name: 'CONTRACTOR', description: 'Contractor access' },
      { name: 'FINANCE_OFFICER', description: 'Finance access' },
    ],
  });

  // Create users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@slpcms.gov.et',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+251911111111',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const director = await prisma.user.create({
    data: {
      email: 'director@slpcms.gov.et',
      password: hashedPassword,
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '+251911111112',
      role: 'DIRECTOR',
      isActive: true,
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: 'pm@slpcms.gov.et',
      password: hashedPassword,
      firstName: 'Almaz',
      lastName: 'Haile',
      phone: '+251911111113',
      role: 'PROJECT_MANAGER',
      isActive: true,
    },
  });

  const ce = await prisma.user.create({
    data: {
      email: 'engineer@slpcms.gov.et',
      password: hashedPassword,
      firstName: 'Biruk',
      lastName: 'Tadesse',
      phone: '+251911111114',
      role: 'CONTRACT_ENGINEER',
      isActive: true,
    },
  });

  const fo = await prisma.user.create({
    data: {
      email: 'finance@slpcms.gov.et',
      password: hashedPassword,
      firstName: 'Meron',
      lastName: 'Wondimu',
      phone: '+251911111115',
      role: 'FINANCE_OFFICER',
      isActive: true,
    },
  });

  await prisma.user.createMany({
    data: [
      { email: 'consultant1@slpcms.gov.et', password: hashedPassword, firstName: 'Dawit', lastName: 'Eshetu', phone: '+251911111116', role: 'CONSULTANT', isActive: true },
      { email: 'contractor1@slpcms.gov.et', password: hashedPassword, firstName: 'Tekle', lastName: 'Gebre', phone: '+251911111117', role: 'CONTRACTOR', isActive: true },
    ],
  });

  // Create contractors
  const contractor1 = await prisma.contractor.create({
    data: {
      name: 'Ethio Light Construction PLC',
      contactPerson: 'Tekle Gebre',
      email: 'info@ethiolight.com',
      phone: '+251911222111',
      address: 'Bole Sub-city, Addis Ababa',
      licenseNumber: 'LIC-2024-001',
      specialization: 'Street Lighting Installation',
      isConsultant: false,
    },
  });

  const contractor2 = await prisma.contractor.create({
    data: {
      name: 'Addis Electrical Works PLC',
      contactPerson: 'Biruk Assefa',
      email: 'info@addiselectrical.com',
      phone: '+251911222112',
      address: 'Mexico Square, Addis Ababa',
      licenseNumber: 'LIC-2024-002',
      specialization: 'Electrical Infrastructure',
      isConsultant: false,
    },
  });

  const consultant1 = await prisma.contractor.create({
    data: {
      name: 'Yetin Engineering Consultancy',
      contactPerson: 'Dawit Eshetu',
      email: 'info@yetinconsult.com',
      phone: '+251911222113',
      address: 'Kazanchis, Addis Ababa',
      licenseNumber: 'LIC-2024-003',
      specialization: 'Infrastructure Engineering',
      isConsultant: true,
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      projectId: 'SLP-0001',
      name: 'Bole Road Street Lighting Upgrade',
      description: 'Upgrade of street lighting along Bole Road from Bole International Airport to Mexico Square',
      budget: 15000000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-08-15'),
      status: 'ACTIVE',
      progressPercent: 65,
      location: 'Bole Sub-city, Addis Ababa',
      createdById: superAdmin.id,
      assignedToId: pm.id,
      contractorId: contractor1.id,
      consultantId: consultant1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectId: 'SLP-0002',
      name: 'Piassa Area Street Light Installation',
      description: 'New street light installation in the historic Piassa area',
      budget: 8500000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      status: 'ACTIVE',
      progressPercent: 30,
      location: 'Arada Sub-city, Addis Ababa',
      createdById: superAdmin.id,
      assignedToId: pm.id,
      contractorId: contractor2.id,
      consultantId: consultant1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      projectId: 'SLP-0003',
      name: 'CMC Road Solar Lighting Project',
      description: 'Solar-powered street lighting along CMC Road',
      budget: 12000000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-02-28'),
      status: 'COMPLETED',
      progressPercent: 100,
      location: 'Yeka Sub-city, Addis Ababa',
      createdById: superAdmin.id,
      assignedToId: pm.id,
      contractorId: contractor1.id,
      consultantId: consultant1.id,
    },
  });

  // Create contracts
  await prisma.contract.create({
    data: {
      contractNumber: 'CTR-0001',
      contractAmount: 14800000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-08-15'),
      status: 'ACTIVE',
      retentionPercent: 10,
      performanceBond: 740000,
      description: 'Main contract for Bole Road Street Lighting Upgrade',
      projectId: project1.id,
      contractorId: contractor1.id,
      managedById: pm.id,
    },
  });

  await prisma.contract.create({
    data: {
      contractNumber: 'CTR-0002',
      contractAmount: 8300000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      status: 'ACTIVE',
      retentionPercent: 10,
      performanceBond: 415000,
      description: 'Contract for Piassa Area Street Light Installation',
      projectId: project2.id,
      contractorId: contractor2.id,
      managedById: pm.id,
    },
  });

  // Create BOQ Items
  await prisma.boqItem.createMany({
    data: [
      {
        itemCode: 'BOQ-001',
        description: 'LED Street Light Fixture 150W',
        unit: 'Pcs',
        quantity: 200,
        unitPrice: 8500,
        totalPrice: 1700000,
        executedQty: 130,
        status: 'APPROVED',
        projectId: project1.id,
        contractorId: contractor1.id,
        createdById: ce.id,
      },
      {
        itemCode: 'BOQ-002',
        description: 'Galvanized Steel Pole 10m',
        unit: 'Pcs',
        quantity: 200,
        unitPrice: 12500,
        totalPrice: 2500000,
        executedQty: 120,
        status: 'APPROVED',
        projectId: project1.id,
        contractorId: contractor1.id,
        createdById: ce.id,
      },
      {
        itemCode: 'BOQ-003',
        description: 'Armored Cable 16mm²',
        unit: 'Meters',
        quantity: 5000,
        unitPrice: 450,
        totalPrice: 2250000,
        executedQty: 3200,
        status: 'APPROVED',
        projectId: project1.id,
        contractorId: contractor1.id,
        createdById: ce.id,
      },
      {
        itemCode: 'BOQ-004',
        description: 'LED Street Light Fixture 100W (Solar)',
        unit: 'Pcs',
        quantity: 150,
        unitPrice: 15000,
        totalPrice: 2250000,
        executedQty: 150,
        status: 'APPROVED',
        projectId: project3.id,
        contractorId: contractor1.id,
        createdById: ce.id,
      },
    ],
  });

  // Create IPC Payments
  await prisma.ipcPayment.create({
    data: {
      ipcNumber: 'IPC-0001',
      amount: 3500000,
      certifiedAmount: 3325000,
      retentionAmount: 350000,
      netAmount: 2975000,
      status: 'PAID',
      description: 'First interim payment for Bole Road project',
      submissionDate: new Date('2024-03-15'),
      certificationDate: new Date('2024-03-25'),
      paymentDate: new Date('2024-04-01'),
      projectId: project1.id,
      contractorId: contractor1.id,
      createdById: pm.id,
    },
  });

  await prisma.ipcPayment.create({
    data: {
      ipcNumber: 'IPC-0002',
      amount: 4200000,
      certifiedAmount: 3990000,
      retentionAmount: 420000,
      netAmount: 3570000,
      status: 'APPROVED',
      description: 'Second interim payment for Bole Road project',
      submissionDate: new Date('2024-05-15'),
      certificationDate: new Date('2024-05-28'),
      projectId: project1.id,
      contractorId: contractor1.id,
      createdById: pm.id,
    },
  });

  // Create project progress records
  await prisma.projectProgress.createMany({
    data: [
      { projectId: project1.id, progressPercent: 10, description: 'Site mobilization and clearing', reportDate: new Date('2024-02-01') },
      { projectId: project1.id, progressPercent: 25, description: 'Foundation work completed', reportDate: new Date('2024-03-01') },
      { projectId: project1.id, progressPercent: 45, description: 'Pole installation in progress', reportDate: new Date('2024-04-01') },
      { projectId: project1.id, progressPercent: 65, description: 'Cabling and fixture installation', reportDate: new Date('2024-05-15') },
      { projectId: project2.id, progressPercent: 10, description: 'Project kickoff and survey', reportDate: new Date('2024-03-15') },
      { projectId: project2.id, progressPercent: 30, description: 'Foundation work started', reportDate: new Date('2024-05-01') },
      { projectId: project3.id, progressPercent: 100, description: 'Project completed and handed over', reportDate: new Date('2024-02-28') },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin: admin@slpcms.gov.et / admin123');
  console.log('  Director: director@slpcms.gov.et / admin123');
  console.log('  PM: pm@slpcms.gov.et / admin123');
  console.log('  Engineer: engineer@slpcms.gov.et / admin123');
  console.log('  Finance: finance@slpcms.gov.et / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
