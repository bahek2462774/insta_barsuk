import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' with { type: "json" };
import { downloadInstagramReel } from './play.mjs'
import fs from 'fs'
import path from 'path'

const token = settings.TELEGRAM_BOT_TOKEN
const mainChatId = settings.GOD
const bot = new TelegramBot(token, { polling: true })

function isVideoFile(filePath) {
	const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];
	const ext = path.extname(filePath).toLowerCase();
	return videoExtensions.includes(ext);
}

function isInstaLink(link) {
	try {
		const url = new URL(link)
		if (!url.hostname.includes('instagram.com')) return false
		const isPost = url.pathname.startsWith('/p/')
		const isReel = url.pathname.startsWith('/reel/')

		return isPost || isReel
	} catch {
		return false
	}
}

bot.on('message', async (msg) => {
	const chatId = msg.chat.id
	const originalMessageId = msg.message_id
	const link = msg.text

	if (link && link.includes && link.includes('instagram.com')) {
		if (!isInstaLink(link)) {
			bot.sendMessage(chatId, `parsing link error: "${link}"`);
			return
		}

		if (mainChatId) {
			await bot.sendMessage(mainChatId, `@${msg.from.username} video: ${link}...`);
		}


		const { message_id } = await bot.sendMessage(chatId, `downloading video: ${link}...`);

		const updateMessage = async message => {
			try {
				await bot.editMessageText(message, { chat_id: chatId, message_id });
			} catch (e) {

			}
		}


		try {
			downloadInstagramReel(link, updateMessage).then(async fetchedData => {
				// Prepare media group array
				const mediaGroup = fetchedData.files.map((filePath, index) => {
					const mediaType = isVideoFile(filePath) ? 'video' : 'photo';

					// Only the first item should have a caption
					const caption = index === 0 ?
						`${fetchedData.caption}\n\n${link}\n\nShared by @${msg.from.username}` :
						'';

					return {
						type: mediaType,
						media: fs.createReadStream(filePath),
						caption: caption
					};
				});

				await bot.sendMediaGroup(chatId, mediaGroup);
				await bot.deleteMessage(chatId, message_id)

				fetchedData.files.forEach(file => fs.unlinkSync(file))

				try {
					await bot.deleteMessage(chatId, originalMessageId)
				} catch (e) {
					console.log('501: failed to remove author message')
				}
			})
		} catch {
			await bot.sendMessage(chatId, `failed to load: ${link}`);
		}
	}
});
