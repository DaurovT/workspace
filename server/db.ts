import { PrismaClient, Prisma } from '@prisma/client';
import { authContext } from './context';
import { emitGlobalEvent } from './socket';

// Ensure Decimal is serialized as a Number to prevent breaking frontend charts and types
(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (model === 'AuditLogEntry' || model === 'CopilotConversation' || model === 'FinanceAlert') {
          return query(args);
        }
        
        const result = await query(args);
        const userId = authContext.getStore()?.userId || 'system';
        basePrisma.auditLogEntry.create({
          data: {
            userId,
            userName: authContext.getStore()?.userName || 'System',
            action: 'CREATE',
            entity: model,
            details: `Создана запись ${model}`,
            newValue: JSON.stringify(result),
          }
        }).catch(console.error);

        emitGlobalEvent('db_mutation', { model, action: 'CREATE', userId, resultId: result.id || result.chatId, data: result });
        return result;
      },
      async update({ model, args, query }) {
        if (model === 'AuditLogEntry' || model === 'CopilotConversation' || model === 'FinanceAlert') {
          return query(args);
        }
        
        let oldRecord = null;
        try {
          oldRecord = await (basePrisma as any)[model].findUnique({ where: args.where });
        } catch (e) {}

        const result = await query(args);
        const userId = authContext.getStore()?.userId || 'system';
        basePrisma.auditLogEntry.create({
          data: {
            userId,
            userName: authContext.getStore()?.userName || 'System',
            action: 'UPDATE',
            entity: model,
            details: `Обновлена запись ${model}`,
            oldValue: oldRecord ? JSON.stringify(oldRecord) : null,
            newValue: JSON.stringify(result),
          }
        }).catch(console.error);

        emitGlobalEvent('db_mutation', { model, action: 'UPDATE', userId, resultId: result.id || result.chatId, data: result });
        return result;
      },
      async delete({ model, args, query }) {
        if (model === 'AuditLogEntry' || model === 'CopilotConversation' || model === 'FinanceAlert') {
          return query(args);
        }

        let oldRecord = null;
        try {
          oldRecord = await (basePrisma as any)[model].findUnique({ where: args.where });
        } catch (e) {}

        const result = await query(args);
        const userId = authContext.getStore()?.userId || 'system';
        basePrisma.auditLogEntry.create({
          data: {
            userId,
            userName: authContext.getStore()?.userName || 'System',
            action: 'DELETE',
            entity: model,
            details: `Удалена запись ${model}`,
            oldValue: oldRecord ? JSON.stringify(oldRecord) : null,
          }
        }).catch(console.error);

        emitGlobalEvent('db_mutation', { model, action: 'DELETE', userId, resultId: result?.id || result?.chatId, data: result });
        return result;
      }
    }
  }
});

export default prisma as any as PrismaClient;
