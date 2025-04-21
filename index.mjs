export const handler = async (event) => {
	// TODO implement
	const response = {
		statusCode: 200,
		body: JSON.stringify('Hello from Lambda! GH remove langdock-2 role'),
	};
	return response;
};
