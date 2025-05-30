import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import { SETTINGS } from './settings.mjs'
import { downloadInstagramReel } from './play.mjs'

const token = SETTINGS.TELEGRAM_BOT_TOKEN
const mainChatId = SETTINGS.GOD
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

function getCaption(caption, msg) {
	return `${caption}\n\n${msg.text}\n\nShared by @${msg.from.username}`
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
				// Silently handle error
			}
		}

		try {
			downloadInstagramReel(link, updateMessage).then(async fetchedData => {
				console.log('fetchedData=', fetchedData.files)

				try {
					// First, chunk the file paths (not the media objects)
					const filePathChunks = _.chunk(fetchedData.files, 10);

					// Process each chunk
					for (let i = 0; i < filePathChunks.length; i++) {
						const chunk = filePathChunks[i];

						// Create media group for this chunk
						const mediaGroup = chunk.map((filePath, index) => {
							const mediaType = isVideoFile(filePath) ? 'video' : 'photo';

							// Only the first item of the first chunk should have a caption
							const caption = (i === 0 && index === 0) ?
								getCaption(fetchedData.caption, msg) : '';

							// Create a fresh file stream for each file
							return {
								type: mediaType,
								media: fs.createReadStream(filePath),
								caption: caption
							};
						});

						// Send this chunk and wait for it to complete
						await updateMessage(`Sending media group ${i + 1} of ${filePathChunks.length}...`);
						await bot.sendMediaGroup(chatId, mediaGroup);
					}

					// Now that all media has been sent, delete the status message
					try {
						bot.deleteMessage(chatId, message_id);
					} catch (e) {
						console.log('Failed to delete status message:', e.message);
					}

					// Delete all files after they've been sent
					for (const file of fetchedData.files) {
						try {
							fs.unlinkSync(file);
						} catch (e) {
							console.log(`Failed to delete file ${file}:`, e.message);
						}
					}

					// Try to delete the original message
					try {
						bot.deleteMessage(chatId, originalMessageId);
					} catch (e) {
						console.log('501: failed to remove author message');
					}

				} catch (error) {
					console.error('Error sending media:', error);
					await bot.sendMessage(chatId, `Error sending media: ${error.message}`);
				}
			}).catch(error => {
				console.error('Download error:', error);
				bot.sendMessage(chatId, `failed to load: ${link}`);
			});
		} catch (error) {
			console.error('Outer error:', error);
			await bot.sendMessage(chatId, `failed to load: ${link}`);
		}
	}
});
