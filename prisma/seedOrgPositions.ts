import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface Pos { code: string; name: string; department?: string; section: string; level: number; staffLimit: number; parentCode?: string; note?: string }

const POSITIONS: Pos[] = [
  // Топ-менеджмент
  { code:'dir',         name:'Генеральный директор',              section:'Управление', level:1, staffLimit:1 },
  { code:'vp_oper',     name:'Зам. директора по операциям',       section:'Управление', level:2, staffLimit:1, parentCode:'dir' },
  { code:'vp_hoz',      name:'Зам. директора по хоз. части',      section:'Управление', level:2, staffLimit:1, parentCode:'dir' },
  { code:'chief_acc',   name:'Главный бухгалтер',                 section:'Бухгалтерия', level:2, staffLimit:1, parentCode:'dir' },
  { code:'buyer',       name:'Специалист по закупкам',            section:'Закупки', level:2, staffLimit:1, parentCode:'dir' },
  { code:'qa',          name:'Рук. группы качества и ПБ',         section:'Качество', level:2, staffLimit:1, parentCode:'dir' },
  { code:'hr_mgr',      name:'Менеджер по кадрам',                section:'HR', level:2, staffLimit:1, parentCode:'dir' },

  // Производство
  { code:'head_prod',   name:'Начальник производства',            section:'Производство', level:3, staffLimit:1, parentCode:'vp_oper' },
  { code:'tech',        name:'Технолог',                          section:'Производство', level:3, staffLimit:1, parentCode:'vp_oper' },
  { code:'brand_chef',  name:'Бренд-шеф',                         section:'Производство', level:3, staffLimit:1, parentCode:'vp_oper' },

  // Хлебобулочный цех
  { code:'bakery_head', name:'Заведующий цехом',   department:'Хлебобулочный цех', section:'Производство', level:4, staffLimit:1, parentCode:'head_prod' },
  { code:'bakery_s_baker', name:'Старший пекарь',  department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:1, parentCode:'bakery_head' },
  { code:'bakery_baker',   name:'Пекарь',           department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:6, parentCode:'bakery_head' },
  { code:'bakery_kneader', name:'Тестомес',         department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:3, parentCode:'bakery_head' },
  { code:'bakery_former',  name:'Формовщик',        department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:3, parentCode:'bakery_head' },
  { code:'bakery_prep',    name:'Заготовщик',       department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:2, parentCode:'bakery_head' },
  { code:'bakery_pack',    name:'Упаковщик-укладчик',department:'Хлебобулочный цех',section:'Производство', level:5, staffLimit:1, parentCode:'bakery_head' },
  { code:'bakery_clean',   name:'Уборщица',         department:'Хлебобулочный цех', section:'Производство', level:5, staffLimit:1, parentCode:'bakery_head' },

  // Кондитерский цех
  { code:'pastry_head',    name:'Заведующий цехом', department:'Кондитерский цех',  section:'Производство', level:4, staffLimit:1, parentCode:'head_prod' },
  { code:'pastry_s_cond',  name:'Старший кондитер', department:'Кондитерский цех',  section:'Производство', level:5, staffLimit:1, parentCode:'pastry_head' },
  { code:'pastry_cond',    name:'Кондитер',         department:'Кондитерский цех',  section:'Производство', level:5, staffLimit:13, parentCode:'pastry_head' },
  { code:'pastry_kneader', name:'Тестомес',         department:'Кондитерский цех',  section:'Производство', level:5, staffLimit:3, parentCode:'pastry_head' },
  { code:'pastry_former',  name:'Формовщик-отделочник', department:'Кондитерский цех', section:'Производство', level:5, staffLimit:3, parentCode:'pastry_head' },
  { code:'pastry_cook',    name:'Повар (самса/выпечка)', department:'Кондитерский цех', section:'Производство', level:5, staffLimit:3, parentCode:'pastry_head' },
  { code:'pastry_prep',    name:'Заготовщик',       department:'Кондитерский цех',  section:'Производство', level:5, staffLimit:3, parentCode:'pastry_head' },
  { code:'pastry_clean',   name:'Уборщица',         department:'Кондитерский цех',  section:'Производство', level:5, staffLimit:1, parentCode:'pastry_head' },

  // Шеф-куратор → Точки
  { code:'chef_curator',   name:'Шеф-куратор точек',              section:'Точки питания', level:4, staffLimit:1, parentCode:'brand_chef' },
  { code:'supervisor',     name:'Супервайзер (старший по точкам)', section:'Точки питания', level:5, staffLimit:3, parentCode:'chef_curator' },

  // Тип А (4 шт — круглосуточная)
  { code:'a_chef',    name:'Шеф-повар',         department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:4, parentCode:'supervisor', note:'Круглосуточная столовая' },
  { code:'a_cook',    name:'Повар',              department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:18, parentCode:'supervisor' },
  { code:'a_kitchen', name:'Кухонный рабочий',  department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:18, parentCode:'supervisor' },
  { code:'a_dist',    name:'Раздатчик',          department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:8, parentCode:'supervisor' },
  { code:'a_cashier', name:'Кассир',             department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:8, parentCode:'supervisor' },
  { code:'a_dish',    name:'Посудомойщица',      department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:8, parentCode:'supervisor' },
  { code:'a_clean',   name:'Уборщица',           department:'Точка Тип А', section:'Точки питания', level:6, staffLimit:4, parentCode:'supervisor' },

  // Тип Б (2 шт — дневная большая)
  { code:'b_chef',    name:'Шеф-повар',         department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },
  { code:'b_cook',    name:'Повар',              department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },
  { code:'b_kitchen', name:'Кухонный рабочий',  department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },
  { code:'b_dist',    name:'Раздатчик',          department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:4, parentCode:'supervisor' },
  { code:'b_cashier', name:'Кассир',             department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },
  { code:'b_dish',    name:'Посудомойщица',      department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },
  { code:'b_clean',   name:'Уборщица',           department:'Точка Тип Б', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },

  // Тип Б2 (6 шт — дневная малая)
  { code:'b2_chef',   name:'Шеф-повар',              department:'Точка Тип Б2', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },
  { code:'b2_cook',   name:'Повар',                   department:'Точка Тип Б2', section:'Точки питания', level:6, staffLimit:12, parentCode:'supervisor' },
  { code:'b2_kitchen',name:'Кухонный рабочий',        department:'Точка Тип Б2', section:'Точки питания', level:6, staffLimit:12, parentCode:'supervisor' },
  { code:'b2_dist',   name:'Раздатчик-кассир',        department:'Точка Тип Б2', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },
  { code:'b2_dish',   name:'Посудомойщица-уборщица',  department:'Точка Тип Б2', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },

  // Тип В (6 шт — буфет)
  { code:'v_s_buffet',name:'Старший буфетчик',  department:'Точка Тип В', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },
  { code:'v_buffet',  name:'Буфетчик',           department:'Точка Тип В', section:'Точки питания', level:6, staffLimit:12, parentCode:'supervisor' },
  { code:'v_dish',    name:'Посудомойщица-уборщица', department:'Точка Тип В', section:'Точки питания', level:6, staffLimit:6, parentCode:'supervisor' },

  // Тип Г (1 — VIP гостевой)
  { code:'g_chef',    name:'Шеф-повар',         department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:1, parentCode:'supervisor' },
  { code:'g_cook',    name:'Повар',              department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:3, parentCode:'supervisor' },
  { code:'g_kitchen', name:'Кухонный рабочий',  department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },
  { code:'g_waiter',  name:'Официант',           department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:2, parentCode:'supervisor' },
  { code:'g_dish',    name:'Посудомойщица',      department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:1, parentCode:'supervisor' },
  { code:'g_clean',   name:'Уборщица',           department:'Гостевой дом (VIP)', section:'Точки питания', level:6, staffLimit:1, parentCode:'supervisor' },

  // Хозяйственная часть
  { code:'guard',     name:'Охранник',           section:'Хозяйственная часть', level:4, staffLimit:3, parentCode:'vp_hoz' },
  { code:'wh_head',   name:'Зав. центральным складом', section:'Склад', level:3, staffLimit:1, parentCode:'vp_hoz' },
  { code:'wh_worker', name:'Кладовщик (приёмка)', section:'Склад', level:4, staffLimit:1, parentCode:'wh_head' },
  { code:'logistics', name:'Менеджер по логистике', section:'Логистика', level:3, staffLimit:1, parentCode:'vp_hoz' },
  { code:'driver',    name:'Водитель-экспедитор', section:'Логистика', level:4, staffLimit:3, parentCode:'logistics' },
  { code:'loader',    name:'Грузчик',             section:'Логистика', level:4, staffLimit:3, parentCode:'logistics' },
  { code:'mechanic',  name:'Электромеханик',      section:'Инженерная служба', level:3, staffLimit:1, parentCode:'vp_hoz' },
  { code:'repairman', name:'Ремонтник (электро/холод/сантехника)', section:'Инженерная служба', level:4, staffLimit:3, parentCode:'mechanic' },

  // Бухгалтерия
  { code:'acc',       name:'Бухгалтер',          section:'Бухгалтерия', level:3, staffLimit:3, parentCode:'chief_acc' },
  { code:'economist', name:'Экономист',           section:'Бухгалтерия', level:3, staffLimit:1, parentCode:'chief_acc' },
  { code:'calc',      name:'Калькулятор',         section:'Бухгалтерия', level:4, staffLimit:2, parentCode:'economist' },
  { code:'lawyer',    name:'Юрисконсульт',        section:'Бухгалтерия', level:3, staffLimit:1, parentCode:'chief_acc' },

  // Качество и HR
  { code:'qa_lab',    name:'Лаборант (бракераж)', section:'Качество', level:3, staffLimit:1, parentCode:'qa' },
  { code:'qa_safety', name:'Специалист по ОТ и ТБ', section:'Качество', level:3, staffLimit:1, parentCode:'qa' },
  { code:'hr_time',   name:'Табельщик',           section:'HR', level:3, staffLimit:1, parentCode:'hr_mgr' },
];

async function seed() {
  console.log('Seeding OrgPositions...');
  // Create all without parentId first
  const codeToId: Record<string, string> = {};
  for (const p of POSITIONS) {
    const existing = await prisma.orgPosition.findUnique({ where: { code: p.code } });
    if (existing) { codeToId[p.code] = existing.id; continue; }
    const created = await prisma.orgPosition.create({
      data: { code: p.code, name: p.name, department: p.department, section: p.section, level: p.level, staffLimit: p.staffLimit, note: p.note }
    });
    codeToId[p.code] = created.id;
  }
  // Set parentIds
  for (const p of POSITIONS) {
    if (p.parentCode && codeToId[p.parentCode]) {
      await prisma.orgPosition.update({ where: { code: p.code }, data: { parentId: codeToId[p.parentCode] } });
    }
  }
  console.log(`Done: ${POSITIONS.length} positions`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
