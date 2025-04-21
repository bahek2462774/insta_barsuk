import TelegramBot from 'node-telegram-bot-api'
import settings from './settings.json' with { type: "json" }

const token = settings.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })
let globalResolve


exports.handler = async (event) => {
	if (event.body) {
		try {
			// Parse the incoming webhook payload from Telegram
			const body = JSON.parse(event.body);
			await new Promise((resolve) => {
				globalResolve = resolve
				bot.processUpdate(body)
			})

			setTimeout(() => { resolve('timeout') }, 2000)
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ text: 'ok' })
			};
		} catch (error) {
			// Handling potential errors during parsing
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

bot.on('message', (msg) => {
	const chatId = msg.chat.id;

	// send a message to the chat acknowledging receipt of their message
	bot.sendMessage(chatId, 'Received your message');
	globalResolve('ok')
});