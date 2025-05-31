import { chromium } from 'playwright-core'

const getSearchResult = async (instagramReelUrl, updateMessage) => {
	console.log('getSearchResult()')

	await updateMessage(`Downloading...`);

	// Launch the browser
	const browser = await chromium.launch({
		headless: true,
		args: ['--enable-features=Vulkan']
	});

	// Create a new context with download preferences
	const context = await browser.newContext({
		acceptDownloads: true,
		viewport: { width: 1280, height: 3800 },
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
		deviceScaleFactor: 1,
		hasTouch: false
	});

	const page = await context.newPage();
	page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
	page.on('pageerror', err => console.error(`PAGE ERROR: ${err.message}`));
	page.on('requestfailed', request =>
		console.error(`REQUEST FAILED: ${request.url()} ${request.failure().errorText}`)
	);


	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en-US,en;q=0.9',
		'sec-ch-ua': '"Google Chrome";v="112", "Chromium";v="112"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"Windows"'
	});

	// Variable to store the XHR response
	let xhrResponse = null;
	let responseError = null;

	try {
		// Set up response listener for the convert API
		await page.route('**/api/convert', async route => {
			try {
				const response = await route.fetch();
				const json = await response.json();
				xhrResponse = json;
				await route.fulfill({ response });
			} catch (error) {
				responseError = error.message;
				await route.continue();
			}
		});

		// Navigate to sssinstagram.com
		await updateMessage(`Opening website...`);
		await page.goto('https://sssinstagram.com/');

		// Wait for the page to load
		await page.waitForLoadState('networkidle');

		// Enter the Instagram URL
		await updateMessage(`Processing URL...`);
		await page.fill('input[type="text"]', instagramReelUrl);

		// Submit the form
		await page.click('button[type="submit"]');

		// Wait for the API response
		await updateMessage(`Waiting for convert response...`);

		// Wait for the convert API response
		const response = await page.waitForResponse(
			response => response.url().includes('/api/convert'),
			{ timeout: 30000 }
		);

		// If we haven't captured the response through the route handler,
		// get it directly from the response object
		if (!xhrResponse) {
			xhrResponse = await response.json();
		}

		// Check if the response contains an error
		if (xhrResponse && xhrResponse.error) {
			return Promise.reject(xhrResponse.error);
		}

		// Return the XHR response
		return xhrResponse;

	} catch (error) {
		console.error('Error during API request:', error.message);

		// If we have a specific response error, return that
		if (responseError) {
			return Promise.reject(responseError);
		}

		// Otherwise return the general error
		return Promise.reject(error.message);
	} finally {
		// Close the browser
		await browser.close();
	}
}

export default getSearchResult