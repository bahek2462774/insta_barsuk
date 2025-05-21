import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' assert { type: "json" };
import { downloadInstagramReel } from './play.mjs'
import fs from 'fs'

const token = settings.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })

function isInstaLink(link) {
	const regex = /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/;
	return regex.test(link.split('?')[0]);
}

bot.on('message', async (msg) => {
	const chatId = msg.chat.id
	const link = msg.text

	if (link && link.includes && link.includes('instagram.com')) {
		if (!isInstaLink(link)) {
			bot.sendMessage(chatId, `parsing link error: "${link}"`);
		}

		const { message_id } = await bot.sendMessage(chatId, `downloading video: ${link}...`);

		const updateMessage = async message => {
			try {
				await bot.editMessageText(message, { chat_id: chatId, message_id });
			} catch (e) {

			}
		}


		try {
			downloadInstagramReel(link, updateMessage).then(async pathToVideo => {
				updateMessage('sending file ...')
				await bot.sendVideo(chatId, pathToVideo, {
					caption: `Video sent by @${msg.from.username}`
				});

				bot.deleteMessage(chatId, message_id)

				fs.unlinkSync(pathToVideo);
			})
		} catch {
			bot.sendMessage(chatId, `failed to load: ${link}`);
		}
	}
});
