import express from 'express';
import prisma from '../db';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


// ─── Procurement Requests ───────────────────────────────────────────────────

router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.procurementRequest.findMany({
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.post('/requests', async (req, res) => {
  try {
    const { number, dateStr, initiator, department, comment } = req.body;
    const newRequest = await prisma.procurementRequest.create({
      data: {
        number,
        dateStr,
        initiator,
        department,
        comment,
      }
    });
    res.json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

router.get('/requests/:id', async (req, res) => {
  try {
    const request = await prisma.procurementRequest.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    if (!request) return res.status(404).json({ error: 'Not found' });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

router.put('/requests/:id', async (req, res) => {
  try {
    const { number, dateStr, initiator, department, comment, status } = req.body;
    const updated = await prisma.procurementRequest.update({
      where: { id: req.params.id },
      data: { number, dateStr, initiator, department, comment, status },
      include: { _count: { select: { items: true } } }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// ─── Procurement Items ──────────────────────────────────────────────────────

router.get('/items', async (req, res) => {
  try {
    const items = await prisma.procurementItem.findMany({
      include: {
        request: true,
        documents: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/items', async (req, res) => {
  try {
    const data = req.body;
    const newItem = await prisma.procurementItem.create({
      data: {
        requestId: data.requestId,
        productName: data.productName,
        category: data.category,
        unit: data.unit,
        quantity: new Prisma.Decimal(data.quantity || 0),
        tenderPrice: new Prisma.Decimal(data.tenderPrice || 0),
        supplierPrice: new Prisma.Decimal(data.supplierPrice || 0),
        plannedDate: data.plannedDate
      }
    });
    res.json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const data = req.body;
    
    // Process decimal fields
    const updateData: any = { ...data };
    const decimalFields = ['quantity', 'tenderPrice', 'supplierPrice', 'exchangeRate', 'logisticsCost', 'brokerPct', 'brokerAmount', 'certification', 'customs', 'otherExpenses', 'vatRate'];
    
    decimalFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = new Prisma.Decimal(data[field]);
      }
    });

    // Don't update relations directly via simple ID assignments if they come as objects
    delete updateData.request;
    delete updateData.documents;
    delete updateData.tender;

    const updated = await prisma.procurementItem.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ─── Tenders ────────────────────────────────────────────────────────────────

router.get('/tenders', async (req, res) => {
  try {
    const tenders = await prisma.tender.findMany({
      include: { items: { include: { request: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

router.post('/tenders', async (req, res) => {
  try {
    const { number, startDate, endDate, comment } = req.body;
    const tender = await prisma.tender.create({ data: { number, startDate, endDate, comment } });
    res.json(tender);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tender' });
  }
});

router.get('/tenders/:id', async (req, res) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { request: true } } }
    });
    if (!tender) return res.status(404).json({ error: 'Not found' });
    res.json(tender);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tender' });
  }
});

router.put('/tenders/:id', async (req, res) => {
  try {
    const { number, startDate, endDate, status, winnerId, comment } = req.body;
    const tender = await prisma.tender.update({
      where: { id: req.params.id },
      data: { number, startDate, endDate, status, winnerId, comment },
      include: { items: { include: { request: true } } }
    });
    res.json(tender);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tender' });
  }
});

// Attach items to tender
router.post('/tenders/:id/items', async (req, res) => {
  try {
    const { itemIds }: { itemIds: string[] } = req.body;
    await prisma.procurementItem.updateMany({
      where: { id: { in: itemIds } },
      data: { tenderId: req.params.id, status: 'in_tender' }
    });
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { request: true } } }
    });
    res.json(tender);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to attach items' });
  }
});

// Remove item from tender
router.delete('/tenders/:tenderId/items/:itemId', async (req, res) => {
  try {
    await prisma.procurementItem.update({
      where: { id: req.params.itemId },
      data: { tenderId: null, status: 'calculated' }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// ─── Excel Import ───────────────────────────────────────────────────────────

router.post('/items/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) return res.status(400).json({ error: 'Excel file is empty' });

    // Column name mapping (supports Russian and English headers)
    const parseRow = (row: any) => {
      const get = (...keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== '') return row[k];
        }
        return undefined;
      };

      return {
        requestId,
        productName: String(get('Наименование', 'Товар', 'productName', 'name', 'Product') || '').trim(),
        category:    String(get('Категория', 'category', 'Category') || '').trim() || null,
        unit:        String(get('Ед.изм.', 'Единица', 'unit', 'Unit', 'ед.изм.') || 'кг').trim(),
        quantity:    new Prisma.Decimal(parseFloat(get('Количество', 'Кол-во', 'quantity', 'Qty') || '0') || 0),
        tenderPrice: new Prisma.Decimal(parseFloat(get('Тендерная цена', 'Тендер', 'tenderPrice', 'Tender Price') || '0') || 0),
        supplierPrice: new Prisma.Decimal(parseFloat(get('Цена поставщика', 'Цена', 'supplierPrice', 'Supplier Price', 'Price') || '0') || 0),
        plannedDate: String(get('Дата поставки', 'Плановая дата', 'plannedDate', 'Planned Date') || '').trim() || null,
        comment:     String(get('Комментарий', 'Примечание', 'comment', 'Comment') || '').trim() || null,
      };
    };

    const validRows = rows.map(parseRow).filter(r => r.productName);

    if (validRows.length === 0) return res.status(400).json({ error: 'No valid rows found. Check column names.' });

    const created = await prisma.$transaction(
      validRows.map(data => prisma.procurementItem.create({ data }))
    );

    res.json({ imported: created.length, items: created });
  } catch (err) {
    console.error('Excel import error:', err);
    res.status(500).json({ error: 'Failed to import Excel file' });
  }
});

export default router;

