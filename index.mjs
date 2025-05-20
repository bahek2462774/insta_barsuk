import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' with { type: 'json' }
import { downloadInstagramReel } from './play.mjs'
import fs from 'fs'

const token = settings.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })
let globalResolve

const RESPONSE = {
	OK: { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'ok' }) },
	ERROR: { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'error' }) }
}

function isInstaLink(link) {
	const regex = /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/;
	return regex.test(link.split('?')[0]);
}

const handler = async (event) => {
	if (event.body) {
		try {
			// Parse the incoming webhook payload from Telegram
			const body = JSON.parse(event.body);
			const link = body.message.text
			if (link.includes('instagram.com')) {
				if (!isInstaLink(body.message.text)) {
					await new Promise((resolve) => {
						globalResolve = resolve
						body.message.text = `parsing link error: "${link}"`
						bot.processUpdate(body)
					})

					return
				}
			}

			await new Promise((resolve) => {
				globalResolve = resolve

				// playwright code here
				downloadInstagramReel(body.message.text).then(async pathToVideo => {
					await bot.sendVideo(body.chat.id, pathToVideo, {
						caption: 'Here is your Instagram video!'
					});

					fs.unlinkSync(pathToVideo);

					bot.processUpdate({
						...body,
						message: {
							...body.message,
							text: `video: ${link} has been sent`
						}
					})
				})
			})

			setTimeout(() => {
				console.log('TIMEOUT 10000')
				resolve('timeout')
			}, 10000)

			return RESPONSE.OK
		} catch (error) {
			console.log('CATCH TIMEOUT')
			console.log(error)

			return RESPONSE.ERROR
		}
	}

};

bot.on('message', async (msg) => {
	const chatId = msg.chat.id;
	//const channelId = bot.getChat(msg.use)

	try {
		await bot.sendMessage(chatId, msg.text);
	} catch (e) {
		console.log('ERROR SENDING MESSAGE')
		console.log(e)
	} finally {
		globalResolve('ok')
	}

});

export default handler