import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' with { type: 'json' }

const token = settings.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })
let globalResolve

const RESPONSE = {
	OK: { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'ok' }) },
	ERROR: { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'error' }) }
}

function isInstaLink(link) {
	const regex = /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/;
	return regex.test(link);
}

const handler = async (event) => {
	if (event.body) {
		try {
			// Parse the incoming webhook payload from Telegram
			const body = JSON.parse(event.body);
			if (!isInstaLink(body.message.text)) return RESPONSE.OK

			console.log('======')
			console.log(body)
			console.log('======')
			await new Promise((resolve) => {
				globalResolve = resolve
				bot.processUpdate(body)
			})

			setTimeout(() => {
				console.log('TIMEOUT 3000')
				resolve('timeout')
			}, 3000)

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

	// send a message to the chat acknowledging receipt of their message
	try {
		await bot.sendMessage(chatId, 'this is a link to a reel: ' + msg.text);
	} catch (e) {
		console.log('ERROR SENDING MESSAGE')
		console.log(e)
	}

	globalResolve('ok')
});

export default handler