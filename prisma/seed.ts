// @ts-nocheck
/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculatePayrollRun } from '../server/services/payrollService';

const prisma = new PrismaClient();

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString(); }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000).toISOString(); }

async function main() {
  console.log('Start seeding for МЧЖ БОК...');

  // Guard: do not overwrite real data (audit P0 #3)
  if (process.env.SEED_FORCE !== 'true') {
    const existing = await prisma.transaction.count();
    if (existing > 0) {
      console.log(`⛔ Seed stopped: DB already has data (${existing} transactions). Run with SEED_FORCE=true to overwrite.`);
      await prisma.$disconnect();
      return;
    }
  }

  // ── Clean existing data ──────────────────────────────────────────────
  await prisma.arcanaComment.deleteMany();
  await prisma.arcanaTask.deleteMany();
  await prisma.arcanaProjectMember.deleteMany();
  await prisma.arcanaProject.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.fund.deleteMany();
  await prisma.plannedOperation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.product.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.importRule.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.budgetScenario.deleteMany();
  await prisma.bdrBudget.deleteMany();
  await prisma.bddsBudget.deleteMany();
  await prisma.auditLogEntry.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.employee.deleteMany();

  // ── 1. Users ─────────────────────────────────────────────────────────
  const SALT = await bcrypt.genSalt(10);
  const users = [
    { id: 'u1', name: 'Генеральный директор', email: 'maylantim@gmail.com',        password: '1320253',    role: 'admin',      avatar: 'ГД', color: '#6366f1', jobTitle: 'Директор' },
    { id: 'u2', name: 'Зам. по производству', email: 'alina@workspace.pro',        password: 'Alina2026!', role: 'member',     avatar: 'ЗП', color: '#f43f5e', jobTitle: 'Зам. директора' },
    { id: 'u3', name: 'Главный технолог',     email: 'dmitry@workspace.pro',       password: 'Dmitry2026!', role: 'member',    avatar: 'ГТ', color: '#22c55e', jobTitle: 'Технолог' },
    { id: 'u4', name: 'Кладовщик',            email: 'elena@workspace.pro',        password: 'Elena2026!', role: 'member',     avatar: 'КЛ', color: '#f59e0b', jobTitle: 'Завскладом' },
    { id: 'u5', name: 'Руководитель столовой', email: 'rustam@workspace.pro',       password: 'Rustam2026!', role: 'member',    avatar: 'РС', color: '#3b82f6', jobTitle: 'Руководитель столовой' },
    { id: 'u6', name: 'Финансовый директор',  email: 'cfo@techproject.uz',         password: 'Cfo@2024!',  role: 'cfo',        avatar: 'ФД', color: '#8b5cf6', jobTitle: 'CFO' },
    { id: 'u7', name: 'Главный бухгалтер',    email: 'accountant@techproject.uz',   password: 'Acc@2024!',  role: 'accountant', avatar: 'БХ', color: '#14b8a6', jobTitle: 'Главный бухгалтер' },
    { id: 'u8', name: 'Повар-бригадир',       email: 'ahmad@workspace.pro',         password: 'Ahmad2026!', role: 'member',     avatar: 'ПБ', color: '#10b981', jobTitle: 'Повар' },
  ];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, SALT);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash },
      create: {
        id: user.id, name: user.name, email: user.email, passwordHash,
        role: user.role, status: 'active', permissions: JSON.stringify(['all']),
        avatar: user.avatar, color: user.color, jobTitle: user.jobTitle,
      }
    });
  }

  // ── 2. Legal Entities ────────────────────────────────────────────────
  await (prisma as any).legalEntity.createMany({
    data: [
      {
        name: '«Бекобод Овқатланиш комбинати» МЧЖ',
        shortName: 'МЧЖ БОК', inn: '305012345', kpp: '112233445', ogrn: '1187746123456',
        type: 'МЧЖ', isMain: true,
        legalAddress: 'Ташкентская обл., г. Бекабад, Промзона',
        actualAddress: 'Ташкентская обл., г. Бекабад, Промзона',
        phone: '+998 70 123-45-67', bankName: 'АКИБ «Узпромстройбанк»', bankMfo: '00036',
        bankAccount: '20208000000000000001', vatMode: 'ОСН', currency: 'UZS',
      }
    ]
  });

  // ── 3. Finance Demo Data ─────────────────────────────────────────────
  console.log('Seeding Finance Demo Data for БОК...');
  
  // Accounts
  const accMain = await prisma.account.create({
    data: { name: 'Основной счет — МЧЖ БОК', balance: 150000000, currency: 'UZS', type: 'Безналичный' }
  });
  const accCash = await prisma.account.create({
    data: { name: 'Наличная касса (Главная)', balance: 45000000, currency: 'UZS', type: 'Наличный' }
  });
  const accAnis = await prisma.account.create({
    data: { name: 'Взаиморасчеты — ООО Анис', balance: 0, currency: 'UZS', type: 'Взаиморасчеты' }
  });
  const accAngren = await prisma.account.create({
    data: { name: 'Взаиморасчеты — ООО Ангрен', balance: 0, currency: 'UZS', type: 'Взаиморасчеты' }
  });

  // Projects (Points of sale / Production units)
  const proj1 = await prisma.project.create({ data: { name: 'Центральное производство', status: 'В работе' } });
  const proj2 = await prisma.project.create({ data: { name: 'Столовая заводоуправления', status: 'В работе' } });
  const proj3 = await prisma.project.create({ data: { name: 'Столовая №1 (Прокатный цех)', status: 'В работе' } });
  const proj4 = await prisma.project.create({ data: { name: 'Столовая №2 (Мартеновский цех)', status: 'В работе' } });
  const proj5 = await prisma.project.create({ data: { name: 'Буфет №1', status: 'В работе' } });

  // Categories - Income
  const revCat1 = await prisma.category.create({ data: { name: 'Выручка столовых (Безнал)', type: 'income', activity: 'operating' } });
  const revCat2 = await prisma.category.create({ data: { name: 'Выручка буфетов', type: 'income', activity: 'operating' } });
  const revCat3 = await prisma.category.create({ data: { name: 'Реализация полуфабрикатов', type: 'income', activity: 'operating' } });
  const revCat4 = await prisma.category.create({ data: { name: 'Выручка по талонам (Спецпитание)', type: 'income', activity: 'operating' } });

  // Categories - Expenses
  const expCatRaw = await prisma.category.create({ data: { name: 'Закупка сырья', type: 'expense', activity: 'operating' } });
  await prisma.category.createMany({ data: [
    { name: 'Мясо и птица', type: 'expense', activity: 'operating', parentId: expCatRaw.id },
    { name: 'Овощи и фрукты', type: 'expense', activity: 'operating', parentId: expCatRaw.id },
    { name: 'Бакалея и сыпучие', type: 'expense', activity: 'operating', parentId: expCatRaw.id },
    { name: 'Молочная продукция', type: 'expense', activity: 'operating', parentId: expCatRaw.id },
  ]});

  const expCatHR = await prisma.category.create({ data: { name: 'ФОТ (Зарплаты)', type: 'expense', activity: 'operating' } });
  await prisma.category.createMany({ data: [
    { name: 'Зарплата поваров и кухонных рабочих', type: 'expense', activity: 'operating', parentId: expCatHR.id },
    { name: 'Зарплата АУП', type: 'expense', activity: 'operating', parentId: expCatHR.id },
    { name: 'Налоги с ФОТ', type: 'expense', activity: 'operating', parentId: expCatHR.id },
  ]});

  const expCatUtil = await prisma.category.create({ data: { name: 'Коммунальные и прочие', type: 'expense', activity: 'operating' } });
  await prisma.category.createMany({ data: [
    { name: 'Электричество', type: 'expense', activity: 'operating', parentId: expCatUtil.id },
    { name: 'Вода и канализация', type: 'expense', activity: 'operating', parentId: expCatUtil.id },
    { name: 'Транспортные расходы', type: 'expense', activity: 'operating', parentId: expCatUtil.id },
    { name: 'Холодильное обслуживание', type: 'expense', activity: 'operating', parentId: expCatUtil.id },
  ]});

  // Assets (Активы)
  const assetGroup = await prisma.category.create({ data: { name: 'Основные средства (Кухня)', type: 'asset', activity: 'investing' } });
  await prisma.category.createMany({ data: [
    { name: 'Тепловое оборудование', type: 'asset', activity: 'investing', parentId: assetGroup.id },
    { name: 'Холодильное оборудование', type: 'asset', activity: 'investing', parentId: assetGroup.id },
    { name: 'Транспорт (Рефрижераторы)', type: 'asset', activity: 'investing', parentId: assetGroup.id },
  ]});
  
  // Liabilities (Обязательства)
  const loanGroup = await prisma.category.create({ data: { name: 'Обязательства и Займы', type: 'liability', activity: 'financing' } });
  await prisma.category.createMany({ data: [
    { name: 'Банковские кредиты', type: 'liability', activity: 'financing', parentId: loanGroup.id },
    { name: 'Взаиморасчеты с поставщиками', type: 'liability', activity: 'financing', parentId: loanGroup.id },
  ]});

  // Equity (Капитал)
  await prisma.category.create({ data: { name: 'Уставный капитал', type: 'equity', activity: 'financing' } });
  await prisma.category.create({ data: { name: 'Нераспределенная прибыль', type: 'equity', activity: 'operating' } });

  // Contractors
  const contAnis = await prisma.contractor.create({ data: { name: 'ООО Анис', shortName: 'Анис (Мясо)' }});
  const contAngren = await prisma.contractor.create({ data: { name: 'ООО Ангрен', shortName: 'Ангрен (Овощи)' }});
  const contZavod = await prisma.contractor.create({ data: { name: 'Металлургический завод', shortName: 'Завод (Талоны)' }});

  await prisma.deal.createMany({
    data: [
      { name: 'Договор на спецпитание 2026', type: 'sale', status: 'in_progress', contractorId: contZavod.id, projectId: proj2.id, amount: 1500000000, paidAmount: 500000000, shippedAmount: 300000000, currency: 'UZS', dateStart: '2026-01-01' },
      { name: 'Поставка мяса I квартал', type: 'purchase', status: 'completed', contractorId: contAnis.id, projectId: proj1.id, amount: 250000000, paidAmount: 250000000, shippedAmount: 250000000, currency: 'UZS', dateStart: '2026-01-10' },
      { name: 'Поставка овощей', type: 'purchase', status: 'in_progress', contractorId: contAngren.id, projectId: proj1.id, amount: 80000000, paidAmount: 40000000, shippedAmount: 50000000, currency: 'UZS', dateStart: '2026-04-10' },
    ]
  });

  await prisma.product.createMany({
    data: [
      { name: 'Мясо (Говядина б/к)', sku: 'RAW-001', type: 'Товар', price: 85000, unit: 'кг', stockBalance: 1200, category: 'Мясо', vatRate: 12, costPrice: 85000, status: 'Активные' },
      { name: 'Картофель', sku: 'RAW-002', type: 'Товар', price: 4500, unit: 'кг', stockBalance: 5000, category: 'Овощи', vatRate: 0, costPrice: 4500, status: 'Активные' },
      { name: 'Обед комплексный', sku: 'MEAL-001', type: 'Услуга', price: 25000, unit: 'шт.', stockBalance: 0, category: 'Питание', vatRate: 12, costPrice: 18000, status: 'Активные' },
      { name: 'Выпечка (Самса)', sku: 'MEAL-002', type: 'Товар', price: 5000, unit: 'шт.', stockBalance: 100, category: 'Буфет', vatRate: 12, costPrice: 2000, status: 'Активные' }
    ]
  });

  // Mock monthly flows
  const monthlyData = [
    { month: '01', rev1: 150000000, rev2: 30000000, expRaw: 85000000, expHR: 65000000 },
    { month: '02', rev1: 155000000, rev2: 32000000, expRaw: 88000000, expHR: 65000000 },
    { month: '03', rev1: 160000000, rev2: 35000000, expRaw: 90000000, expHR: 68000000 },
    { month: '04', rev1: 158000000, rev2: 33000000, expRaw: 89000000, expHR: 68000000 },
    { month: '05', rev1: 165000000, rev2: 38000000, expRaw: 95000000, expHR: 70000000 },
    { month: '06', rev1: 170000000, rev2: 40000000, expRaw: 98000000, expHR: 70000000 },
  ];

  for (const m of monthlyData) {
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-15`, amount: m.rev1, type: 'income', accountId: accMain.id, categoryId: revCat4.id, projectId: proj2.id, isPaidConfirmed: true }
     });
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-20`, amount: m.rev2, type: 'income', accountId: accCash.id, categoryId: revCat2.id, projectId: proj5.id, isPaidConfirmed: true }
     });
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-05`, amount: m.expRaw, type: 'expense', accountId: accMain.id, categoryId: expCatRaw.id, isPaidConfirmed: true }
     });
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-10`, amount: m.expHR, type: 'expense', accountId: accMain.id, categoryId: expCatHR.id, isPaidConfirmed: true }
     });
  }

  // Assets
  await prisma.asset.createMany({
    data: [
      { name: 'Пароконвектомат Rational 101', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2025-05-01', initialCost: 120000000, usefulLifeMonths: 60, salvageValue: 20000000, status: 'В эксплуатации' },
      { name: 'Холодильная камера 20 куб.м', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2025-06-15', initialCost: 85000000, usefulLifeMonths: 84, salvageValue: 5000000, status: 'В эксплуатации' },
      { name: 'Мясорубка МИМ-300', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2026-01-10', initialCost: 15000000, usefulLifeMonths: 48, salvageValue: 2000000, status: 'В эксплуатации' }
    ]
  });

  await prisma.loan.createMany({
    data: [
      { name: 'Кредит на оборудование', bankName: 'Узпромстройбанк', principalAmount: 200000000, interestRate: 22, termMonths: 36, startDate: '2025-05-01', type: 'Кредит' },
    ]
  });

  await prisma.fund.createMany({
    data: [
      { name: 'Амортизационный фонд', targetAmount: 150000000, currentBalance: 45000000, currency: 'UZS', type: 'reserve' },
    ]
  });

  // ── 4. Arcana Workspace Data ─────────────────────────────────────────
  console.log('Seeding Arcana Workspace Data (Организация питания)...');

  await prisma.arcanaProject.create({
    data: { id: 'p1', name: 'Модернизация холодного цеха', color: '#654ef1', icon: '❄️', description: 'Ремонт и закупка новых холодильников', status: 'active' }
  });
  await prisma.arcanaProject.create({
    data: { id: 'p2', name: 'Открытие Столовой №3', color: '#22c55e', icon: '🏗️', description: 'Новая точка в цехе переработки', status: 'active' }
  });

  await prisma.arcanaProjectMember.createMany({
    data: [
      { projectId: 'p1', userId: 'u1', role: 'admin' },
      { projectId: 'p1', userId: 'u2', role: 'member' },
      { projectId: 'p1', userId: 'u3', role: 'member' },
      { projectId: 'p2', userId: 'u1', role: 'admin' },
      { projectId: 'p2', userId: 'u5', role: 'member' },
    ]
  });

  await prisma.arcanaTask.createMany({
    data: [
      {
        id: 't1', projectId: 'p1', title: 'Монтаж сэндвич-панелей',
        description: 'Установка теплоизоляции в помещении нового холодного цеха.',
        priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(14), dueDate: daysAgo(7),
        tags: JSON.stringify(['ремонт']), estimatedHours: 40, loggedHours: 42,
        position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 't2', projectId: 'p1', title: 'Закупка холодильных агрегатов',
        description: 'Оплата счета и организация доставки компрессоров Bitzer.',
        priority: 'urgent', status: 'in_progress', assigneeId: 'u6', reporterId: 'u1',
        startDate: daysAgo(5), dueDate: daysFromNow(3),
        tags: JSON.stringify(['закупки']), estimatedHours: 10, loggedHours: 4,
        position: 0, progress: 45, dependencies: JSON.stringify([{ type: 'FS', taskId: 't1' }]),
      },
      {
        id: 't3', projectId: 'p2', title: 'Утверждение плана-меню для Столовой №3',
        description: 'С учетом сменного графика рабочих.',
        priority: 'high', status: 'in_progress', assigneeId: 'u3', reporterId: 'u2',
        startDate: daysAgo(4), dueDate: daysFromNow(3),
        tags: JSON.stringify(['меню']), estimatedHours: 12, loggedHours: 8,
        position: 0, progress: 60, dependencies: '[]',
      },
    ]
  });

  // ── 10. Budgets and Scenarios ─────────────────────────────────────────
  const scenario1 = await prisma.budgetScenario.create({
    data: {
      name: 'Бюджет питания 2026',
      year: 2026,
      isApproved: true,
      createdAt: new Date().toISOString(),
    }
  });

  const legalEntity = await (prisma as any).legalEntity.findFirst();

  await prisma.bdrBudget.create({
    data: {
      name: 'БДР Столовых 2026',
      type: 'БДР',
      currency: 'UZS',
      entityId: legalEntity?.id || '',
      projectId: proj1.id,
      periodStart: '2026-01',
      periodEnd: '2026-12',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Александр',
      scenarioId: scenario1.id,
    }
  });

  await prisma.bddsBudget.create({
    data: {
      name: 'БДДС Закупок 2026',
      currency: 'UZS',
      entityId: legalEntity?.id || '',
      projectId: proj1.id,
      periodStart: '2026-01',
      periodEnd: '2026-12',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Александр',
      scenarioId: scenario1.id,
    }
  });

  // ── 11. HR & Payroll Demo Data ─────────────────────────────────────────
  console.log('Seeding HR & Payroll Data for BOK...');

  const existingUsers = await prisma.user.findMany();
  
  const employees = [];
  for (let i = 0; i < existingUsers.length; i++) {
    const user = existingUsers[i];
    let dept = 'Производство';
    let position = user.jobTitle || 'Сотрудник';
    let salary = 4000000;
    
    if (user.role === 'admin' || user.role === 'cfo') {
      dept = 'АУП';
      salary = 15000000;
    } else if (position.includes('Бухгалтер')) {
      dept = 'Бухгалтерия';
      salary = 8000000;
    } else if (position.includes('Повар')) {
      dept = 'Горячий цех';
      salary = 6000000;
    } else if (position.includes('Завскладом')) {
      dept = 'Склад';
      salary = 5000000;
    }

    const emp = await prisma.employee.create({
      data: {
        userId: user.id,
        department: dept,
        position: position,
        hireDate: `2024-0${(i % 9) + 1}-15`,
        salary: salary,
        currency: 'UZS'
      }
    });
    employees.push(emp);
  }

  // Absences
  if (employees.length >= 4) {
    await prisma.absence.createMany({
      data: [
        { employeeId: employees[1].id, type: 'vacation', startDate: '2026-05-10', endDate: '2026-05-24', status: 'approved', note: 'Ежегодный отпуск' },
        { employeeId: employees[3].id, type: 'sick', startDate: '2026-04-28', endDate: '2026-04-30', status: 'approved', note: 'ОРВИ' },
      ]
    });
  }

  // Payroll Run for May 2026
  const empsWithAbsences = await prisma.employee.findMany({ include: { absences: true } });
  const { totalGross, totalNet, entries } = calculatePayrollRun(5, 2026, 'final', empsWithAbsences);

  await prisma.payrollRun.create({
    data: {
      month: 5,
      year: 2026,
      status: 'calculated',
      totalGross: totalGross,
      totalNet: totalNet,
      entries: {
        create: entries.map(e => ({
          employeeId: e.employeeId,
          baseSalary: e.baseSalary,
          bonus: e.bonus,
          deductions: e.deductions,
          netAmount: e.netAmount,
          details: { create: e.details.create }
        }))
      }
    }
  });

  console.log('Seeding finished for БОК.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
