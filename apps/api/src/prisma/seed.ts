import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // ── Demo Hospital ─────────────────────────────────────────────────────────
  const hospital = await prisma.hospital.upsert({
    where: { registrationNumber: 'DEMO-HOSP-001' },
    update: {},
    create: {
      name: 'UHID Demo Hospital',
      registrationNumber: 'DEMO-HOSP-001',
      address: '123 Health Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '044-12345678',
      email: 'admin@demohosp.com',
      isVerified: true,
    },
  });
  console.log('  ✅ Hospital created:', hospital.name);

  // ── Demo Patient ──────────────────────────────────────────────────────────
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@uhid.demo' },
    update: {},
    create: {
      email: 'patient@uhid.demo',
      phone: '9000000001',
      passwordHash: await argon2.hash('Demo@1234'),
      role: Role.PATIENT,
      isVerified: true,
      patient: {
        create: {
          uhid: 'UH-100001',
          firstName: 'Arjun',
          lastName: 'Kumar',
          dateOfBirth: new Date('1995-06-15'),
          gender: 'MALE',
          bloodGroup: 'O_POS',
          allergies: ['Penicillin', 'Dust mites'],
          chronicConditions: ['Type 2 Diabetes'],
          currentMedications: ['Metformin 500mg'],
          heightCm: 175,
          weightKg: 72,
        },
      },
    },
  });
  console.log('  ✅ Patient created:', patientUser.email, '(UHID: UH-100001)');

  // ── Demo Doctor ───────────────────────────────────────────────────────────
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@uhid.demo' },
    update: {},
    create: {
      email: 'doctor@uhid.demo',
      phone: '9000000002',
      passwordHash: await argon2.hash('Demo@1234'),
      role: Role.DOCTOR,
      isVerified: true,
      doctor: {
        create: {
          firstName: 'Dr. Priya',
          lastName: 'Sharma',
          licenseNumber: 'MCI-2020-12345',
          specialty: 'General Medicine',
          qualifications: ['MBBS', 'MD'],
          hospitalId: hospital.id,
          department: 'OPD',
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
  });
  console.log('  ✅ Doctor created:', doctorUser.email);

  // ── Demo Hospital Staff ───────────────────────────────────────────────────
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@uhid.demo' },
    update: {},
    create: {
      email: 'staff@uhid.demo',
      phone: '9000000003',
      passwordHash: await argon2.hash('Demo@1234'),
      role: Role.HOSPITAL_STAFF,
      isVerified: true,
      hospitalStaff: {
        create: {
          firstName: 'Ravi',
          lastName: 'Patel',
          staffType: 'LAB_TECHNICIAN',
          department: 'Pathology Lab',
          hospitalId: hospital.id,
          isVerified: true,
        },
      },
    },
  });
  console.log('  ✅ Hospital Staff created:', staffUser.email);

  // ── Demo Hospital Admin ───────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@uhid.demo' },
    update: {},
    create: {
      email: 'admin@uhid.demo',
      phone: '9000000004',
      passwordHash: await argon2.hash('Demo@1234'),
      role: Role.HOSPITAL_ADMIN,
      isVerified: true,
      hospitalAdmin: {
        create: {
          firstName: 'Sunita',
          lastName: 'Mehta',
          hospitalId: hospital.id,
        },
      },
    },
  });
  console.log('  ✅ Hospital Admin created:', adminUser.email);

  // ── Demo Insurance Provider ───────────────────────────────────────────────
  const insuranceUser = await prisma.user.upsert({
    where: { email: 'insurance@uhid.demo' },
    update: {},
    create: {
      email: 'insurance@uhid.demo',
      phone: '9000000005',
      passwordHash: await argon2.hash('Demo@1234'),
      role: Role.INSURANCE_PROVIDER,
      isVerified: true,
      insuranceProvider: {
        create: {
          firstName: 'Neha',
          lastName: 'Joshi',
          agentId: 'STAR-AGT-001',
          companyName: 'Star Health Insurance',
          companyCode: 'STARHEALTH',
          isVerified: true,
        },
      },
    },
  });
  console.log('  ✅ Insurance Provider created:', insuranceUser.email);

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('📋 Demo Login Credentials (password: Demo@1234)');
  console.log('   Patient:          patient@uhid.demo   (UHID: UH-100001)');
  console.log('   Doctor:           doctor@uhid.demo');
  console.log('   Hospital Staff:   staff@uhid.demo');
  console.log('   Hospital Admin:   admin@uhid.demo');
  console.log('   Insurance:        insurance@uhid.demo');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
