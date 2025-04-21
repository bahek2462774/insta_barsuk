exports.handler = async (event) => {
	if (!event.body) {
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ text: 'no body' })
		};
	}

	try {
		// Parse the incoming webhook payload from Telegram
		const body = JSON.parse(event.body);
		// Extract the text from the Telegram message
		const sentMessage = body.message && body.message.text ? body.message.text : "No message found";

		// Create the response message
		const responseMessage = `Hello World ${sentMessage}`;

		// Return the response with a 200 status code
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ text: responseMessage })
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
};
