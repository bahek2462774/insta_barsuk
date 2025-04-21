import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' with { type: "json" }

const token = settings.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })
let globalResolve


const handler = async (event) => {
	if (event.body) {
		try {
			// Parse the incoming webhook payload from Telegram
			const body = JSON.parse(event.body);
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

			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ text: 'ok' })
			};
		} catch (error) {
			console.log('CATCH TIMEOUT')
			console.log(error)

			return {
				statusCode: 400,
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ error: error.message })
			};
		}
	}

};

bot.on('message', async (msg) => {
	const chatId = msg.chat.id;
	//const channelId = bot.getChat(msg.use)

	// send a message to the chat acknowledging receipt of their message
	try {
		await bot.sendMessage(chatId, 'New Message' + + new Date());
	} catch (e) {
		console.log('ERROR SENDING MESSAGE')
		console.log(e)
	}

	globalResolve('ok')
});

export default handler