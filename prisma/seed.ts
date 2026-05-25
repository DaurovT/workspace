/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculatePayrollRun } from '../server/services/payrollService';

const prisma = new PrismaClient();

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString(); }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000).toISOString(); }

async function main() {
  console.log('Start seeding...');

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
    { id: 'u1', name: 'Администратор',        email: 'maylantim@gmail.com',        password: '1320253',    role: 'admin',      avatar: 'АД', color: '#6366f1', jobTitle: 'Системный администратор' },
    { id: 'u2', name: 'Алина Кириенко',        email: 'alina@workspace.pro',        password: 'Alina2026!', role: 'member',     avatar: 'АК', color: '#f43f5e', jobTitle: 'UI/UX дизайнер' },
    { id: 'u3', name: 'Дмитрий Нагорный',      email: 'dmitry@workspace.pro',       password: 'Dmitry2026!', role: 'member',    avatar: 'ДН', color: '#22c55e', jobTitle: 'Frontend-разработчик' },
    { id: 'u4', name: 'Елена Морозова',         email: 'elena@workspace.pro',        password: 'Elena2026!', role: 'member',     avatar: 'ЕМ', color: '#f59e0b', jobTitle: 'QA-инженер' },
    { id: 'u5', name: 'Рустам Каримов',         email: 'rustam@workspace.pro',       password: 'Rustam2026!', role: 'member',    avatar: 'РК', color: '#3b82f6', jobTitle: 'Backend-разработчик' },
    { id: 'u6', name: 'Финансовый директор',    email: 'cfo@techproject.uz',         password: 'Cfo@2024!',  role: 'cfo',        avatar: 'ФД', color: '#8b5cf6', jobTitle: 'CFO' },
    { id: 'u7', name: 'Бухгалтер',             email: 'accountant@techproject.uz',   password: 'Acc@2024!',  role: 'accountant', avatar: 'БХ', color: '#14b8a6', jobTitle: 'Главный бухгалтер' },
    { id: 'u8', name: 'Буранов Ахмад',         email: 'ahmad@workspace.pro',         password: 'Ahmad2026!', role: 'member',     avatar: 'БА', color: '#10b981', jobTitle: 'Сотрудник' },
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
        name: 'Масъулияти чекланган жамият «ТехПроект»',
        shortName: 'МЧЖ «ТехПроект»', inn: '123456789', kpp: '771201001', ogrn: '1187746123456',
        type: 'МЧЖ', isMain: true,
        legalAddress: 'Ташкент, Мирзо-Улугбекский район, ул. Амир Темур, д. 15',
        actualAddress: 'Ташкент, ул. Амир Темур, д. 15',
        phone: '+998 71 123-45-67', bankName: 'АКИБ «Ипотека-банк»', bankMfo: '00036',
        bankAccount: '20208000000000000001', vatMode: 'ОСН', currency: 'UZS',
      },
      {
        name: 'Якка тартибли тадбиркор Петров Иван',
        shortName: 'ЯТТ Петров И.С.', inn: '98765432100001', ogrn: '312774601234567',
        type: 'ЯТТ', isMain: false,
        legalAddress: 'Ташкент, Юнусабадский район', actualAddress: 'Ташкент',
        phone: '+998 90 987-65-43', bankName: 'АО «Халк банк»', bankMfo: '00043',
        bankAccount: '20802810338001234567', vatMode: 'УСН 6%', currency: 'UZS',
      },
    ]
  });

  // ── 3. Finance Demo Data ─────────────────────────────────────────────
  console.log('Seeding Finance Demo Data...');
  const account = await prisma.account.create({
    data: { name: 'Основной счет', balance: 9000000, currency: 'UZS', type: 'Безналичный' }
  });

  const proj1 = await prisma.project.create({ data: { name: 'Разработка', status: 'В работе' } });
  const proj2 = await prisma.project.create({ data: { name: 'Дизайн', status: 'В работе' } });
  const proj3 = await prisma.project.create({ data: { name: 'Аудит', status: 'Завершен' } });
  const proj4 = await prisma.project.create({ data: { name: 'Консалтинг', status: 'В работе' } });
  const proj5 = await prisma.project.create({ data: { name: 'Поддержка', status: 'В работе' } });

  const revCat1 = await prisma.category.create({ data: { name: 'Выручка от услуг', type: 'income', activity: 'operating' } });
  const revCat2 = await prisma.category.create({ data: { name: 'Продажи товаров', type: 'income', activity: 'operating' } });
  const revCat3 = await prisma.category.create({ data: { name: 'Аренда', type: 'income', activity: 'operating' } });
  const revCat4 = await prisma.category.create({ data: { name: 'Прочее (доходы)', type: 'income', activity: 'operating' } });

  const expCat1 = await prisma.category.create({ data: { name: 'ФОТ (Зарплаты)', type: 'expense', activity: 'operating' } });
  // Subcategories for ФОТ
  await prisma.category.createMany({ data: [
    { name: 'Оклад (Base Salary)', type: 'expense', activity: 'operating', parentId: expCat1.id },
    { name: 'Премии и бонусы', type: 'expense', activity: 'operating', parentId: expCat1.id },
    { name: 'НДФЛ', type: 'expense', activity: 'operating', parentId: expCat1.id },
    { name: 'ИНПС / Соц. отчисления', type: 'expense', activity: 'operating', parentId: expCat1.id },
  ]});

  const expCat2 = await prisma.category.create({ data: { name: 'Закупки', type: 'expense', activity: 'operating' } });
  await prisma.category.create({ data: { name: 'Закупка сырья и материалов', type: 'expense', activity: 'operating', parentId: expCat2.id } });
  await prisma.category.create({ data: { name: 'Транспортно-заготовительные', type: 'expense', activity: 'operating', parentId: expCat2.id } });

  const expCat3 = await prisma.category.create({ data: { name: 'Аренда офиса', type: 'expense', activity: 'operating' } });
  const expCat4 = await prisma.category.create({ data: { name: 'Налоги', type: 'expense', activity: 'operating' } });
  const expCat5 = await prisma.category.create({ data: { name: 'Услуги связи', type: 'expense', activity: 'operating' } });

  const marketingCat = await prisma.category.create({ data: { name: 'Маркетинг и реклама', type: 'expense', activity: 'operating' } });
  await prisma.category.createMany({ data: [
    { name: 'Таргетированная реклама', type: 'expense', activity: 'operating', parentId: marketingCat.id },
    { name: 'SEO и Контент', type: 'expense', activity: 'operating', parentId: marketingCat.id },
    { name: 'PR и Мероприятия', type: 'expense', activity: 'operating', parentId: marketingCat.id },
  ]});

  const itCat = await prisma.category.create({ data: { name: 'IT инфраструктура', type: 'expense', activity: 'operating' } });
  await prisma.category.createMany({ data: [
    { name: 'Облачные сервисы (AWS/GCP)', type: 'expense', activity: 'operating', parentId: itCat.id },
    { name: 'Лицензии ПО', type: 'expense', activity: 'operating', parentId: itCat.id },
    { name: 'Оборудование', type: 'expense', activity: 'investing', parentId: itCat.id },
  ]});

  // Assets (Активы)
  const assetGroup = await prisma.category.create({ data: { name: 'Основные средства', type: 'asset', activity: 'investing' } });
  await prisma.category.createMany({ data: [
    { name: 'Компьютерное оборудование', type: 'asset', activity: 'investing', parentId: assetGroup.id },
    { name: 'Офисная мебель', type: 'asset', activity: 'investing', parentId: assetGroup.id },
    { name: 'Транспортные средства', type: 'asset', activity: 'investing', parentId: assetGroup.id },
  ]});
  
  await prisma.category.create({ data: { name: 'Нематериальные активы (НМА)', type: 'asset', activity: 'investing' } });

  // Liabilities (Обязательства)
  const loanGroup = await prisma.category.create({ data: { name: 'Кредиты и Займы', type: 'liability', activity: 'financing' } });
  await prisma.category.createMany({ data: [
    { name: 'Банковские кредиты', type: 'liability', activity: 'financing', parentId: loanGroup.id },
    { name: 'Займы учредителей', type: 'liability', activity: 'financing', parentId: loanGroup.id },
    { name: 'Лизинговые обязательства', type: 'liability', activity: 'financing', parentId: loanGroup.id },
  ]});

  // Equity (Капитал)
  await prisma.category.create({ data: { name: 'Уставный капитал', type: 'equity', activity: 'financing' } });
  await prisma.category.create({ data: { name: 'Нераспределенная прибыль', type: 'equity', activity: 'operating' } });

  const contractor = await prisma.contractor.create({ data: { name: 'ООО Крупный Клиент', shortName: 'Клиент' }});

  await prisma.deal.createMany({
    data: [
      { name: 'Разработка портала', type: 'sale', status: 'completed', contractorId: contractor.id, projectId: proj1.id, amount: 5200000, paidAmount: 5200000, shippedAmount: 0, currency: 'UZS', dateStart: '2026-01-10' },
      { name: 'Дизайн приложения', type: 'sale', status: 'completed', contractorId: contractor.id, projectId: proj2.id, amount: 2100000, paidAmount: 2100000, shippedAmount: 0, currency: 'UZS', dateStart: '2026-02-10' },
      { name: 'Аудит безопасности', type: 'sale', status: 'completed', contractorId: contractor.id, projectId: proj3.id, amount: 1500000, paidAmount: 1500000, shippedAmount: 0, currency: 'UZS', dateStart: '2026-03-10' },
      { name: 'Консалтинг IT', type: 'sale', status: 'completed', contractorId: contractor.id, projectId: proj4.id, amount: 1000000, paidAmount: 1000000, shippedAmount: 0, currency: 'UZS', dateStart: '2026-04-10' },
      { name: 'Техподдержка', type: 'sale', status: 'completed', contractorId: contractor.id, projectId: proj5.id, amount: 500000, paidAmount: 500000, shippedAmount: 0, currency: 'UZS', dateStart: '2026-05-10' },
    ]
  });

  await prisma.product.createMany({
    data: [
      { name: 'Услуга разработки', sku: 'SRV-001', type: 'Услуга', price: 5000000, unit: 'шт', stockBalance: 0, category: 'Разработка', vatRate: 12, costPrice: 0, status: 'Активен' },
      { name: 'Лицензия ПО', sku: 'LIC-001', type: 'Товар', price: 1200000, unit: 'шт', stockBalance: 100, category: 'Софт', vatRate: 12, costPrice: 500000, status: 'Активен' },
      { name: 'Аудит системы', sku: 'SRV-002', type: 'Услуга', price: 3000000, unit: 'шт', stockBalance: 0, category: 'Консалтинг', vatRate: 12, costPrice: 0, status: 'Активен' },
      { name: 'Серверное оборудование', sku: 'HW-001', type: 'Товар', price: 15000000, unit: 'шт', stockBalance: 5, category: 'Железо', vatRate: 12, costPrice: 10000000, status: 'Активен' }
    ]
  });

  const monthlyData = [
    { month: '01', rev: 5200000, exp: 4100000 },
    { month: '02', rev: 5800000, exp: 4500000 },
    { month: '03', rev: 5500000, exp: 4200000 },
    { month: '04', rev: 6100000, exp: 4800000 },
    { month: '05', rev: 6700000, exp: 5100000 },
    { month: '06', rev: 6400000, exp: 5000000 },
  ];

  for (const m of monthlyData) {
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-15`, amount: m.rev, type: 'income', accountId: account.id, categoryId: revCat1.id, projectId: proj1.id, isPaidConfirmed: true }
     });
     await prisma.transaction.create({
       data: { date: `2026-${m.month}-20`, amount: m.exp, type: 'expense', accountId: account.id, categoryId: expCat1.id, isPaidConfirmed: true }
     });
  }

  await prisma.transaction.createMany({
    data: [
      { date: '2026-01-05', amount: 4500000, type: 'income', accountId: account.id, categoryId: revCat1.id, isPaidConfirmed: true },
      { date: '2026-01-06', amount: 2000000, type: 'income', accountId: account.id, categoryId: revCat2.id, isPaidConfirmed: true },
      { date: '2026-01-07', amount: 800000,  type: 'income', accountId: account.id, categoryId: revCat3.id, isPaidConfirmed: true },
      { date: '2026-01-08', amount: 300000,  type: 'income', accountId: account.id, categoryId: revCat4.id, isPaidConfirmed: true },
      { date: '2026-01-10', amount: 1500000, type: 'expense', accountId: account.id, categoryId: expCat1.id, isPaidConfirmed: true },
      { date: '2026-01-11', amount: 1200000, type: 'expense', accountId: account.id, categoryId: expCat2.id, isPaidConfirmed: true },
      { date: '2026-01-12', amount: 500000,  type: 'expense', accountId: account.id, categoryId: expCat3.id, isPaidConfirmed: true },
      { date: '2026-01-13', amount: 400000,  type: 'expense', accountId: account.id, categoryId: expCat4.id, isPaidConfirmed: true },
      { date: '2026-01-14', amount: 100000,  type: 'expense', accountId: account.id, categoryId: expCat5.id, isPaidConfirmed: true },
    ]
  });

  await prisma.asset.createMany({
    data: [
      { name: 'MacBook Pro M2', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2025-10-01', initialCost: 25000000, usefulLifeMonths: 36, salvageValue: 5000000, status: 'В эксплуатации' },
      { name: 'Сервер Dell PowerEdge', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2025-11-15', initialCost: 45000000, usefulLifeMonths: 60, salvageValue: 10000000, status: 'В эксплуатации' },
      { name: 'Офисная мебель', category: 'Основное средство', type: 'Оборудование', acquisitionDate: '2026-01-10', initialCost: 15000000, usefulLifeMonths: 48, salvageValue: 2000000, status: 'В эксплуатации' }
    ]
  });

  await prisma.loan.createMany({
    data: [
      { name: 'Кредит на развитие', bankName: 'Капиталбанк', principalAmount: 100000000, interestRate: 22, termMonths: 24, startDate: '2025-09-01', type: 'Кредит' },
      { name: 'Авто в лизинг', bankName: 'Ипотека-банк', principalAmount: 250000000, interestRate: 18, termMonths: 36, startDate: '2025-12-01', type: 'Лизинг' }
    ]
  });

  await prisma.fund.createMany({
    data: [
      { name: 'Резервный фонд', targetAmount: 50000000, currentBalance: 15000000, currency: 'UZS', type: 'reserve' },
      { name: 'Налоги', targetAmount: 20000000, currentBalance: 5000000, currency: 'UZS', type: 'savings' }
    ]
  });

  await prisma.plannedOperation.createMany({
    data: [
      { date: '2026-05-15', amount: 12000000, type: 'expense', categoryId: expCat1.id, accountId: account.id },
      { date: '2026-05-20', amount: 45000000, type: 'income', categoryId: revCat1.id, accountId: account.id }
    ]
  });

  await prisma.paymentRequest.createMany({
    data: [
      { number: 'PR-001', dateStr: '2026-05-10', amount: 5000000, purpose: 'Оплата за интернет', contractorId: contractor.id, categoryId: expCat5.id, projectId: proj1.id, status: 'pending_ceo', authorId: 'u1' },
      { number: 'PR-002', dateStr: '2026-05-11', amount: 1500000, purpose: 'Канцтовары', contractorId: contractor.id, categoryId: expCat2.id, projectId: proj1.id, status: 'approved', authorId: 'u2' }
    ]
  });

  await prisma.purchase.createMany({
    data: [
      { number: 'PUR-001', name: 'Закупка серверов', contractorId: contractor.id, amount: 15000000, paidAmount: 0, status: 'new', category: expCat2.id, startDate: '2026-05-01', dueDate: '2026-05-15', deliveryStatus: 'pending' },
      { number: 'PUR-002', name: 'Лицензии', contractorId: contractor.id, amount: 2500000, paidAmount: 2500000, status: 'delivered', category: expCat2.id, startDate: '2026-04-10', dueDate: '2026-04-15', deliveryStatus: 'done' }
    ]
  });

  await prisma.invoice.createMany({
    data: [
      { number: 'INV-001', contractorId: contractor.id, amount: 5200000, paidAmount: 0, status: 'sent', issuedDate: '2026-05-01', dueDate: '2026-05-10', description: 'Оплата за разработку', vatAmount: 0 },
      { number: 'INV-002', contractorId: contractor.id, amount: 2100000, paidAmount: 2100000, status: 'paid', issuedDate: '2026-04-01', dueDate: '2026-04-10', description: 'Предоплата', vatAmount: 0 }
    ]
  });

  // ── 4. Arcana Workspace Data ─────────────────────────────────────────
  console.log('Seeding Arcana Workspace Data...');

  // Projects
  await prisma.arcanaProject.create({
    data: { id: 'p1', name: 'Arcana', color: '#654ef1', icon: '🌀', description: 'Разработка основного продукта', status: 'active' }
  });
  await prisma.arcanaProject.create({
    data: { id: 'p2', name: 'Сайт компании', color: '#22c55e', icon: '🌐', description: 'Лендинг и блог', status: 'active' }
  });
  await prisma.arcanaProject.create({
    data: { id: 'p3', name: 'Мобильное приложение', color: '#f97316', icon: '📱', description: 'iOS и Android приложение', status: 'active' }
  });

  // Project Members
  await prisma.arcanaProjectMember.createMany({
    data: [
      { projectId: 'p1', userId: 'u1', role: 'admin' },
      { projectId: 'p1', userId: 'u2', role: 'member' },
      { projectId: 'p1', userId: 'u3', role: 'member' },
      { projectId: 'p1', userId: 'u4', role: 'member' },
      { projectId: 'p1', userId: 'u5', role: 'member' },
      { projectId: 'p2', userId: 'u2', role: 'admin' },
      { projectId: 'p2', userId: 'u3', role: 'member' },
      { projectId: 'p3', userId: 'u1', role: 'admin' },
      { projectId: 'p3', userId: 'u4', role: 'member' },
      { projectId: 'p3', userId: 'u5', role: 'member' },
    ]
  });

  // Tasks — Arcana (p1): 10 main tasks + 4 subtasks
  await prisma.arcanaTask.createMany({
    data: [
      {
        id: 't1', projectId: 'p1', title: 'Дизайн UI-потока авторизации',
        description: 'Создать вайрфреймы и хай-фай макеты для экранов входа, регистрации и сброса пароля.',
        priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(14), dueDate: daysAgo(7),
        tags: JSON.stringify(['дизайн', 'авторизация']), estimatedHours: 16, loggedHours: 14,
        position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 'st1', projectId: 'p1', parentId: 't1', title: 'Вайрфреймы',
        priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(14), dueDate: daysAgo(10),
        tags: '[]', estimatedHours: 8, loggedHours: 8, position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 'st2', projectId: 'p1', parentId: 't1', title: 'Хай-фай макеты',
        priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(10), dueDate: daysAgo(7),
        tags: '[]', estimatedHours: 8, loggedHours: 6, position: 1, progress: 100, dependencies: '[]',
      },
      {
        id: 't2', projectId: 'p1', title: 'Реализация drag-and-drop в Канбане',
        description: 'Построить Канбан-доску с полной поддержкой перетаскивания карточек.',
        priority: 'urgent', status: 'in_progress', assigneeId: 'u1', reporterId: 'u1',
        startDate: daysAgo(5), dueDate: daysFromNow(3),
        tags: JSON.stringify(['фронтенд', 'канбан']), estimatedHours: 24, loggedHours: 12,
        position: 0, progress: 45, dependencies: JSON.stringify([{ type: 'FS', taskId: 't1' }]),
      },
      {
        id: 'st3', projectId: 'p1', parentId: 't2', title: 'DnD колонок',
        priority: 'urgent', status: 'done', assigneeId: 'u1', reporterId: 'u1',
        startDate: daysAgo(5), dueDate: daysAgo(2),
        tags: '[]', estimatedHours: 8, loggedHours: 8, position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 'st4', projectId: 'p1', parentId: 't2', title: 'DnD карточек',
        priority: 'urgent', status: 'in_progress', assigneeId: 'u1', reporterId: 'u1',
        startDate: daysAgo(2), dueDate: daysFromNow(1),
        tags: '[]', estimatedHours: 10, loggedHours: 4, position: 1, progress: 40, dependencies: '[]',
      },
      {
        id: 't3', projectId: 'p1', title: 'Движок рендеринга диаграммы Ганта',
        description: 'Кастомная диаграмма Ганта с масштабами день/неделя/месяц.',
        priority: 'urgent', status: 'in_progress', assigneeId: 'u3', reporterId: 'u1',
        startDate: daysAgo(3), dueDate: daysFromNow(7),
        tags: JSON.stringify(['фронтенд', 'гант']), estimatedHours: 40, loggedHours: 10,
        position: 1, progress: 25, dependencies: JSON.stringify([{ type: 'FS', taskId: 't2' }]),
      },
      {
        id: 't4', projectId: 'p1', title: 'Проектирование схемы базы данных',
        description: 'Разработать нормализованную схему для задач, проектов, пользователей.',
        priority: 'high', status: 'done', assigneeId: 'u5', reporterId: 'u1',
        startDate: daysAgo(20), dueDate: daysAgo(10),
        tags: JSON.stringify(['бэкенд', 'база данных']), estimatedHours: 12, loggedHours: 10,
        position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 't5', projectId: 'p1', title: 'WebSocket синхронизация в реальном времени',
        description: 'Реализовать socket.io сервер для мгновенного обновления задач.',
        priority: 'high', status: 'review', assigneeId: 'u5', reporterId: 'u1',
        startDate: daysAgo(7), dueDate: daysFromNow(2),
        tags: JSON.stringify(['бэкенд', 'реалтайм']), estimatedHours: 20, loggedHours: 18,
        position: 0, progress: 80, dependencies: JSON.stringify([{ type: 'FS', taskId: 't4' }]),
      },
      {
        id: 't6', projectId: 'p1', title: 'Система уведомлений (email + внутренние)',
        description: 'Построить пайплайн уведомлений о назначении задач и упоминаниях.',
        priority: 'medium', status: 'todo', assigneeId: 'u4', reporterId: 'u1',
        startDate: daysFromNow(3), dueDate: daysFromNow(14),
        tags: JSON.stringify(['бэкенд', 'уведомления']), estimatedHours: 16, loggedHours: 0,
        position: 0, progress: 0, dependencies: JSON.stringify([{ type: 'FS', taskId: 't5' }]),
      },
      {
        id: 't7', projectId: 'p1', title: 'Дизайн-система и библиотека компонентов',
        description: 'Создать переиспользуемые React-компоненты на основе токенов дизайн-системы.',
        priority: 'medium', status: 'in_progress', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(10), dueDate: daysFromNow(5),
        tags: JSON.stringify(['фронтенд', 'дизайн']), estimatedHours: 30, loggedHours: 20,
        position: 2, progress: 65, dependencies: '[]',
      },
      {
        id: 'st7', projectId: 'p1', parentId: 't7', title: 'Кнопки',
        priority: 'medium', status: 'done', assigneeId: 'u2', reporterId: 'u1',
        startDate: daysAgo(10), dueDate: daysAgo(8),
        tags: '[]', estimatedHours: 5, loggedHours: 5, position: 0, progress: 100, dependencies: '[]',
      },
      {
        id: 't8', projectId: 'p1', title: 'Написание документации API',
        description: 'Задокументировать все REST-эндпоинты в формате OpenAPI/Swagger.',
        priority: 'low', status: 'todo', assigneeId: null, reporterId: 'u1',
        startDate: daysFromNow(10), dueDate: daysFromNow(20),
        tags: JSON.stringify(['документация']), estimatedHours: 8, loggedHours: 0,
        position: 1, progress: 0, dependencies: '[]',
      },
      {
        id: 't9', projectId: 'p1', title: 'Настройка CI/CD пайплайна',
        description: 'GitHub Actions для автоматического тестирования, сборки и деплоя.',
        priority: 'medium', status: 'todo', assigneeId: 'u1', reporterId: 'u1',
        startDate: daysFromNow(5), dueDate: daysFromNow(10),
        tags: JSON.stringify(['devops']), estimatedHours: 12, loggedHours: 0,
        position: 2, progress: 0, dependencies: '[]',
      },
      {
        id: 't10', projectId: 'p1', title: 'Интеграционные тесты (E2E)',
        description: 'Написать комплексные E2E-тесты на Playwright.',
        priority: 'low', status: 'blocked', assigneeId: 'u4', reporterId: 'u1',
        startDate: daysFromNow(15), dueDate: daysFromNow(25),
        tags: JSON.stringify(['qa', 'тестирование']), estimatedHours: 24, loggedHours: 0,
        position: 0, progress: 0,
        dependencies: JSON.stringify([{ type: 'FS', taskId: 't9' }, { type: 'relates_to', taskId: 't8' }]),
      },
      // Tasks — Сайт компании (p2)
      {
        id: 't11', projectId: 'p2', title: 'Главный экран (Hero) лендинга',
        description: 'Спроектировать и разработать hero-секцию с анимированным градиентом.',
        priority: 'high', status: 'in_progress', assigneeId: 'u2', reporterId: 'u2',
        startDate: daysAgo(4), dueDate: daysFromNow(3),
        tags: JSON.stringify(['фронтенд', 'дизайн']), estimatedHours: 12, loggedHours: 8,
        position: 0, progress: 60, dependencies: '[]',
      },
      {
        id: 't12', projectId: 'p2', title: 'SEO оптимизация и мета-теги',
        description: 'Реализовать структурированные данные, og-теги и карту сайта.',
        priority: 'medium', status: 'todo', assigneeId: 'u3', reporterId: 'u2',
        startDate: daysFromNow(4), dueDate: daysFromNow(8),
        tags: JSON.stringify(['seo']), estimatedHours: 6, loggedHours: 0,
        position: 0, progress: 0, dependencies: '[]',
      },
    ]
  });

  // ── 10. Budgets and Scenarios ─────────────────────────────────────────
  const scenario1 = await prisma.budgetScenario.create({
    data: {
      name: 'Базовый 2026',
      year: 2026,
      isApproved: true,
      createdAt: new Date().toISOString(),
    }
  });

  const legalEntity = await (prisma as any).legalEntity.findFirst();

  await prisma.bdrBudget.create({
    data: {
      name: 'БДР 2026',
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
      name: 'БДДС 2026',
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
  console.log('Seeding HR & Payroll Data...');

  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length === 0) {
    console.log('No users found to create employees for.');
    return;
  }

  const employees = [];
  for (let i = 0; i < existingUsers.length; i++) {
    const user = existingUsers[i];
    
    // Intelligently infer from user properties
    let dept = 'Общий отдел';
    let position = user.jobTitle || 'Сотрудник';
    let salary = 8000000;
    
    const lowerJob = position.toLowerCase();
    
    // Infer Department
    if (lowerJob.includes('разработчик') || lowerJob.includes('frontend') || lowerJob.includes('backend') || lowerJob.includes('cto')) {
      dept = 'Разработка';
    } else if (lowerJob.includes('qa') || lowerJob.includes('тестировщик')) {
      dept = 'QA';
    } else if (lowerJob.includes('дизайн') || lowerJob.includes('designer') || lowerJob.includes('ux')) {
      dept = 'Дизайн';
    } else if (lowerJob.includes('бухгалтер') || lowerJob.includes('cfo') || lowerJob.includes('финанс')) {
      dept = 'Финансы';
    } else if (lowerJob.includes('админ') || lowerJob.includes('admin')) {
      dept = 'ИТ Оперейшнс';
    } else if (user.role === 'admin') {
      dept = 'Управление';
    }

    // Infer Salary
    if (user.role === 'admin' || user.role === 'cfo' || lowerJob.includes('cfo') || lowerJob.includes('cto')) {
      salary = 20000000;
    } else if (lowerJob.includes('главный') || lowerJob.includes('senior')) {
      salary = 15000000;
    } else if (lowerJob.includes('разработчик') || lowerJob.includes('дизайнер')) {
      salary = 10000000;
    } else if (lowerJob.includes('qa')) {
      salary = 8500000;
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
        { employeeId: employees[2].id, type: 'personal', startDate: '2026-05-05', endDate: '2026-05-05', status: 'pending', note: 'Семейные обстоятельства' },
        { employeeId: employees[0].id, type: 'vacation', startDate: '2026-06-01', endDate: '2026-06-14', status: 'pending', note: 'Летний отпуск' },
      ]
    });
  }

  // Payroll Run for May 2026 (using the real calculation engine)
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

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
