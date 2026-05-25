import TelegramBot from 'node-telegram-bot-api';
import db from '../db';
import path from 'path';
import fs from 'fs';
import { t } from './botLocales';
import { uploadToS3 } from '../utils/s3';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram Bot will not work properly.');
}
let bot: TelegramBot | null = null;

async function getState(chatId: number) {
  const state = await db.telegramSession.findUnique({ where: { chatId: chatId.toString() } });
  return (state || { step: 'IDLE', language: 'ru' }) as any;
}

async function updateState(chatId: number, data: any) {
  await db.telegramSession.upsert({
    where: { chatId: chatId.toString() },
    update: data,
    create: { chatId: chatId.toString(), step: data.step || 'IDLE', language: data.language || 'ru', ...data }
  });
}

const getMenuKeyboard = (isWorker: boolean, lang: string = 'ru') => {
  const keyboard = [
    [{ text: t(lang, 'menuCreate') }],
    [{ text: t(lang, 'menuMyTickets') }]
  ];
  if (isWorker) {
    keyboard.push([{ text: t(lang, 'menuWorkerTasks') }]);
  }
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      is_persistent: true
    }
  };
};

const categoryMap: Record<string, string> = {
  'cat_it': 'it',
  'cat_electric': 'electric',
  'cat_plumbing': 'plumbing',
  'cat_furniture': 'furniture',
  'cat_other': 'other'
};

const sendCategoryKeyboard = async (chatId: number, lang: string = 'ru') => {
  await bot?.sendMessage(chatId, t(lang, 'categoryPrompt'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'cat_it'), callback_data: 'cat_it' }],
        [{ text: t(lang, 'cat_electric'), callback_data: 'cat_electric' }],
        [{ text: t(lang, 'cat_plumbing'), callback_data: 'cat_plumbing' }],
        [{ text: t(lang, 'cat_furniture'), callback_data: 'cat_furniture' }],
        [{ text: t(lang, 'cat_other'), callback_data: 'cat_other' }]
      ]
    }
  });
};

export const initTelegramBot = () => {
  try {
    bot = new TelegramBot(token, { polling: true });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('✅ Telegram Bot started in polling mode (Wizard)');

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      
      const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
      
      if (!profile) {
        await updateState(chatId, { step: 'AWAITING_LANGUAGE' });
        await bot?.sendMessage(
          chatId, 
          t('ru', 'welcome'),
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
                [{ text: '🇺🇿 O\'zbekcha', callback_data: 'lang_uz' }]
              ]
            }
          }
        );
      } else {
        await updateState(chatId, { step: 'IDLE', language: profile.language });
        await bot?.sendMessage(
          chatId, 
          t(profile.language, 'welcomeBack', { name: profile.firstName }),
          getMenuKeyboard(!!profile.userId, profile.language)
        );
      }
    });

    bot.onText(/\/bind (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const code = match?.[1];
      
      if (!code) return;

      const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
      if (!profile) {
        await bot?.sendMessage(chatId, t('ru', 'needRegister'));
        return;
      }
      const lang = profile.language || 'ru';

      try {
        const user = await db.user.findUnique({ where: { telegramBindCode: code } });
        if (!user) {
          await bot?.sendMessage(chatId, t(lang, 'userNotFound'));
          return;
        }

        await db.telegramProfile.update({
          where: { chatId: chatId.toString() },
          data: { userId: user.id }
        });
        
        // Invalidate the code so it cannot be used again
        await db.user.update({
          where: { id: user.id },
          data: { telegramBindCode: null }
        });

        await bot?.sendMessage(chatId, t(lang, 'bindSuccess', { name: user.name || user.email }), getMenuKeyboard(true, lang));
      } catch (err) {
        console.error('Error binding user', err);
        await bot?.sendMessage(chatId, t(lang, 'bindError'));
      }
    });

    // Handle inline keyboard callbacks
    bot.on('callback_query', async (query) => {
      if (!query.message || !query.data) return;
      const chatId = query.message.chat.id;
      
      if (query.data.startsWith('lang_')) {
        const lang = query.data.split('_')[1];
        await updateState(chatId, { step: 'AWAITING_PHONE', language: lang });
        await bot?.answerCallbackQuery(query.id);
        await bot?.sendMessage(
          chatId,
          t(lang, 'askPhone'),
          {
            reply_markup: {
              keyboard: [[{ text: t(lang, 'sendPhoneBtn'), request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      } else if (query.data.startsWith('cat_')) {
        const category = categoryMap[query.data] || 'other';
        const state = await getState(chatId);
        const lang = state.language || 'ru';
        await updateState(chatId, { step: 'AWAITING_LOCATION', category });
        
        await bot?.answerCallbackQuery(query.id);
        await bot?.sendMessage(chatId, t(lang, 'locationPrompt'));
      } else if (query.data.startsWith('take_')) {
        const ticketId = query.data.split('_')[1];
        try {
          const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
          const lang = profile?.language || 'ru';
          const ticket = await db.serviceTicket.update({
            where: { id: ticketId },
            data: { status: 'in_progress' }
          });
          await bot?.answerCallbackQuery(query.id);
          await bot?.sendMessage(chatId, t(lang, 'takeWorkSuccessMsg', { number: ticket.number }));
          
          if (ticket.telegramChatId) {
            const reporterProfile = await db.telegramProfile.findUnique({ where: { chatId: ticket.telegramChatId } });
            await bot?.sendMessage(ticket.telegramChatId, t(reporterProfile?.language || 'ru', 'notifyTaken', { number: ticket.number }));
          }
        } catch (e) {
          await bot?.answerCallbackQuery(query.id, { text: 'Error' });
        }
      } else if (query.data.startsWith('resolve_')) {
        const ticketId = query.data.split('_')[1];
        try {
          const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
          const lang = profile?.language || 'ru';
          const ticket = await db.serviceTicket.update({
            where: { id: ticketId },
            data: { status: 'resolved' }
          });
          await bot?.answerCallbackQuery(query.id);
          await bot?.sendMessage(chatId, t(lang, 'resolveSuccessMsg', { number: ticket.number }));
          
          if (ticket.telegramChatId) {
            const reporterProfile = await db.telegramProfile.findUnique({ where: { chatId: ticket.telegramChatId } });
            await bot?.sendMessage(ticket.telegramChatId, t(reporterProfile?.language || 'ru', 'notifyResolved', { number: ticket.number }));
          }
        } catch (e) {
          await bot?.answerCallbackQuery(query.id, { text: 'Error' });
        }
      }
    });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      let state = await getState(chatId);

      // Ignore commands
      if (msg.text?.startsWith('/')) return;

      // Handle replies to bot messages for comments
      if (msg.reply_to_message && msg.text) {
        const replyText = msg.reply_to_message.text || msg.reply_to_message.caption || '';
        const match = replyText.match(/#(\d+)/);
        if (match) {
          const ticketNumber = parseInt(match[1]);
          const ticket = await db.serviceTicket.findFirst({ where: { number: ticketNumber } });
          if (ticket) {
            const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
            
            await db.serviceTicketComment.create({
              data: {
                ticketId: ticket.id,
                text: msg.text,
                isSystem: false,
                authorId: profile?.userId
              }
            });
            
            // Notify assignee if reporter commented, or vice-versa
            // We assume if it's not the assignee who commented, we notify the assignee
            if (ticket.assigneeId && profile?.userId !== ticket.assigneeId) {
              const assigneeProfile = await db.telegramProfile.findFirst({ where: { userId: ticket.assigneeId } });
              if (assigneeProfile) {
                const assigneeLang = assigneeProfile.language || 'ru';
                const notificationText = `💬 ${t(assigneeLang, 'newComment', { number: ticket.number })}\n\n${msg.text}`;
                await notifyUser(assigneeProfile.chatId, notificationText);
              }
            } else if (profile?.userId === ticket.assigneeId && ticket.telegramChatId && ticket.telegramChatId !== chatId.toString()) {
              // Worker commented, notify reporter
              const reporterProfile = await db.telegramProfile.findUnique({ where: { chatId: ticket.telegramChatId } });
              const reporterLang = reporterProfile?.language || 'ru';
              const notificationText = `💬 ${t(reporterLang, 'newComment', { number: ticket.number })}\n\n${msg.text}`;
              await notifyUser(ticket.telegramChatId, notificationText);
            }

            await bot?.sendMessage(chatId, `✅ Комментарий к заявке #${ticketNumber} добавлен.`, { reply_to_message_id: msg.message_id });
            return;
          }
        }
      }

      const reporterName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Unknown';
      const telegramUsername = msg.from?.username ? `@${msg.from.username}` : undefined;

      // Fetch profile to know worker status
      const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });

      const lang = profile?.language || state.language || 'ru';

      // Restrict menu actions if not registered
      if (msg.text === t(lang, 'menuCreate') || msg.text === t(lang, 'menuMyTickets') || msg.text === t(lang, 'menuWorkerTasks')) {
        if (!profile) {
          await updateState(chatId, { step: 'AWAITING_PHONE', language: lang });
          await bot?.sendMessage(
            chatId, 
            t(lang, 'askPhone'),
            {
              reply_markup: {
                keyboard: [[{ text: t(lang, 'sendPhoneBtn'), request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            }
          );
          return;
        }

        if (state.step && state.step !== 'IDLE') {
          // If they were in the middle of a wizard but clicked menu again, reset
          await updateState(chatId, { step: 'IDLE', language: lang });
        }
      }

      // Handle Menu Actions
      if (msg.text === t(lang, 'menuCreate')) {
        await updateState(chatId, { step: 'IDLE', language: lang });
        await sendCategoryKeyboard(chatId, lang);
        return;
      }

      if (msg.text === t(lang, 'menuMyTickets')) {
        try {
          const tickets = await db.serviceTicket.findMany({
            where: { telegramChatId: chatId.toString() },
            orderBy: { createdAt: 'desc' },
            take: 5
          });

          if (tickets.length === 0) {
            await bot?.sendMessage(chatId, t(lang, 'noTickets'), getMenuKeyboard(!!profile?.userId, lang));
            return;
          }

          await bot?.sendMessage(chatId, t(lang, 'lastTickets'), getMenuKeyboard(!!profile?.userId, lang));

          for (const tck of tickets) {
            const statusKey = `status_${tck.status}`;
            const statusText = t(lang, statusKey);
            let text = t(lang, 'ticketTemplate', {
              number: tck.number,
              status: statusText,
              title: tck.title,
              location: tck.location || '-',
              date: new Date(tck.createdAt).toLocaleDateString()
            });

            if (tck.photoUrl) {
              const photoPath = path.join(process.cwd(), tck.photoUrl);
              if (fs.existsSync(photoPath)) {
                await bot?.sendPhoto(chatId, fs.createReadStream(photoPath), { caption: text });
              } else {
                await bot?.sendMessage(chatId, text + '\n' + t(lang, 'photoNotFound'));
              }
            } else {
              await bot?.sendMessage(chatId, text);
            }
          }
        } catch (error) {
          console.error(error);
          await bot?.sendMessage(chatId, t(lang, 'ticketFetchError'), getMenuKeyboard(!!profile?.userId, lang));
        }
        return;
      }

      if (msg.text === t(lang, 'menuWorkerTasks') && profile?.userId) {
        try {
          const tickets = await db.serviceTicket.findMany({
            where: { assigneeId: profile.userId, status: { in: ['new', 'in_progress'] } },
            orderBy: { createdAt: 'desc' }
          });

          if (tickets.length === 0) {
            await bot?.sendMessage(chatId, t(lang, 'noActiveTasks'), getMenuKeyboard(true, lang));
            return;
          }

          await bot?.sendMessage(chatId, t(lang, 'activeTasksHeader'), getMenuKeyboard(true, lang));

          for (const tck of tickets) {
            const statusKey = `status_${tck.status}`;
            const statusText = t(lang, statusKey);
            let text = t(lang, 'ticketTemplate', {
              number: tck.number,
              status: statusText,
              title: tck.title,
              location: tck.location || '-',
              date: new Date(tck.createdAt).toLocaleDateString()
            });

            const inline_keyboard: any[][] = [];
            if (tck.status === 'new') {
              inline_keyboard.push([{ text: t(lang, 'btnTake'), callback_data: `take_${tck.id}` }]);
            } else if (tck.status === 'in_progress') {
              inline_keyboard.push([{ text: t(lang, 'btnResolve'), callback_data: `resolve_${tck.id}` }]);
            }

            if (tck.photoUrl) {
              const photoPath = path.join(process.cwd(), tck.photoUrl);
              if (fs.existsSync(photoPath)) {
                await bot?.sendPhoto(chatId, fs.createReadStream(photoPath), { caption: text, reply_markup: { inline_keyboard } });
              } else {
                await bot?.sendMessage(chatId, text + '\n' + t(lang, 'photoNotFound'), { reply_markup: { inline_keyboard } });
              }
            } else {
              await bot?.sendMessage(chatId, text, { reply_markup: { inline_keyboard } });
            }
          }
        } catch (error) {
          console.error(error);
          await bot?.sendMessage(chatId, t(lang, 'taskLoadError'), getMenuKeyboard(true, lang));
        }
        return;
      }

      switch (state.step) {
        case 'AWAITING_PHONE':
          if (msg.contact?.phone_number) {
            state.phone = msg.contact.phone_number;
          } else if (msg.text) {
            state.phone = msg.text;
          } else {
            await bot?.sendMessage(chatId, t(lang, 'phoneError'));
            return;
          }
          state.step = 'AWAITING_NAME';
          await bot?.sendMessage(chatId, t(lang, 'askName'), { reply_markup: { remove_keyboard: true } });
          break;

        case 'AWAITING_NAME':
          if (!msg.text) return;
          state.name = msg.text;
          state.step = 'AWAITING_JOB_TITLE';
          await bot?.sendMessage(chatId, t(lang, 'askJob'));
          break;

        case 'AWAITING_JOB_TITLE':
          if (!msg.text) return;
          
          try {
            await db.telegramProfile.create({
              data: {
                chatId: chatId.toString(),
                phone: state.phone || '',
                firstName: state.name || '',
                jobTitle: msg.text,
                language: state.language || 'ru',
                username: msg.from?.username ? `@${msg.from.username}` : null
              }
            });
            await updateState(chatId, { step: 'IDLE', language: state.language || 'ru' });
            await bot?.sendMessage(chatId, t(state.language || 'ru', 'registrationSuccess'), getMenuKeyboard(false, state.language || 'ru'));
          } catch (e) {
            console.error('Registration error', e);
            await bot?.sendMessage(chatId, t(state.language || 'ru', 'registrationError'));
          }
          break;

        case 'IDLE':
          // Wait for menu interaction
          break;

        case 'AWAITING_LOCATION':
          if (!msg.text) {
            await bot?.sendMessage(chatId, t(lang, 'locError'));
            return;
          }
          state.location = msg.text;
          state.step = 'AWAITING_DESCRIPTION';
          await bot?.sendMessage(chatId, t(lang, 'descriptionPrompt'));
          break;

        case 'AWAITING_DESCRIPTION':
          if (!msg.text) {
            await bot?.sendMessage(chatId, t(lang, 'descError'));
            return;
          }
          state.description = msg.text;
          state.step = 'AWAITING_PHOTO';
          await bot?.sendMessage(chatId, t(lang, 'photoPrompt'));
          break;

        case 'AWAITING_PHOTO':
          let photoUrl: string | undefined = undefined;

          if (msg.photo && msg.photo.length > 0) {
            try {
              // Get the highest resolution photo
              const photo = msg.photo[msg.photo.length - 1];
              const fileId = photo.file_id;
              
              // Download file
              const filePath = await bot?.downloadFile(fileId, path.join(process.cwd(), 'uploads'));
              if (filePath) {
                const fileName = path.basename(filePath);
                
                if (process.env.S3_ENDPOINT) {
                  // Upload to S3
                  const buffer = fs.readFileSync(filePath);
                  const mimeType = 'image/jpeg'; // Telegram returns JPEGs for photos
                  const s3Key = await uploadToS3(buffer, fileName, mimeType);
                  photoUrl = `/${process.env.S3_BUCKET || 'uploads'}/${s3Key}`;
                  
                  // Cleanup local file
                  fs.unlinkSync(filePath);
                } else {
                  photoUrl = `/uploads/${fileName}`;
                }
              }
            } catch (err) {
              console.error('Failed to download photo', err);
            }
          } else if (msg.text?.toLowerCase() !== t(lang, 'skipWord') && msg.text?.toLowerCase() !== 'пропустить' && msg.text !== '/skip') {
             await bot?.sendMessage(chatId, t(lang, 'photoError'));
             return;
          }

          try {
            const profile = await db.telegramProfile.findUnique({ where: { chatId: chatId.toString() } });
            const finalReporterName = profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : reporterName;

            const title = state.description!.length > 50 ? state.description!.substring(0, 47) + '...' : state.description!;
            
            const ticket = await db.serviceTicket.create({
              data: {
                title,
                description: state.description!,
                category: state.category || 'other',
                location: state.location,
                photoUrl,
                telegramChatId: chatId.toString(),
                reporterName: finalReporterName,
                telegramUsername,
                status: 'new',
                priority: 'medium'
              }
            });

            await bot?.sendMessage(chatId, t(lang, 'ticketCreated', { number: ticket.number }), getMenuKeyboard(!!profile?.userId, lang));
            
            // Reset state
            await updateState(chatId, { step: 'IDLE', language: lang });
            
          } catch (error) {
            console.error('Error creating ticket:', error);
            await bot?.sendMessage(chatId, t(lang, 'ticketCreateError'), getMenuKeyboard(false, lang));
          }
          break;
      }
    });

  } catch (err) {
    console.error('Failed to initialize Telegram Bot:', err);
  }
};

export const notifyUser = async (chatId: string, message: string) => {
  if (!bot) return;
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(`Failed to send message to chatId ${chatId}:`, error);
  }
};
