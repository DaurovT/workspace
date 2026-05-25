const fs = require('fs');

let file = fs.readFileSync('server/services/telegramBot.ts', 'utf-8');

// Replace UserState interface and const userStates
file = file.replace(/interface UserState \{[\s\S]*?const userStates: Record<number, UserState> = \{\};/, `async function getState(chatId: number) {
  const state = await db.telegramSession.findUnique({ where: { chatId: chatId.toString() } });
  return state || { step: 'IDLE', language: 'ru' };
}

async function updateState(chatId: number, data: any) {
  await db.telegramSession.upsert({
    where: { chatId: chatId.toString() },
    update: data,
    create: { chatId: chatId.toString(), step: data.step || 'IDLE', language: data.language || 'ru', ...data }
  });
}`);

// Replace userStates[chatId] reads
file = file.replace(/const state = userStates\[chatId\] \|\| \{ step: 'IDLE' \};/g, `let state = await getState(chatId);`);
file = file.replace(/const lang = userStates\[chatId\]\?\.language \|\| 'ru';/g, `const state = await getState(chatId);\n        const lang = state.language || 'ru';`);
file = file.replace(/userStates\[chatId\] = \{ \.\.\.userStates\[chatId\], /g, `await updateState(chatId, { `);

// Replace userStates[chatId] writes
file = file.replace(/userStates\[chatId\] = (\{.*?\});/g, `await updateState(chatId, $1);`);

fs.writeFileSync('server/services/telegramBot.ts', file);
