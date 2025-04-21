export const handler = async (event) => {
	if (event.body !== null && event.body !== undefined) {
		console.log(event.body)
	}
	// TODO implement
	const response = {
		statusCode: 200,
		body: JSON.stringify('Hello from Lambda! GH remove role'),
	};
	return response;
};
