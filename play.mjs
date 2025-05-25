import { chromium } from 'playwright-core'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Enable Playwright debug logs
//process.env.DEBUG = 'playwright:*';


const DOM_DOWNLOAD_BUTTON = '.button__download'
const DOM_CAPTION = '.output-list__caption'

const getCaption = async (page) => {
	try {
		await page.waitForSelector(DOM_CAPTION, { timeout: 1000 })
		const captions = await page.locator(DOM_CAPTION)
		return await captions.innerText()
	} catch (e) {
		console.log(e)
		return ''
	}
}

async function humanDelay(min = 50, max = 2000) {
	const delay = Math.floor(Math.random() * (max - min) + min);
	await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Downloads an Instagram reel using sssinstagram.com
 * @param {string} instagramReelUrl - Full URL to the Instagram reel
 * @returns {Promise<string>} - Path to the downloaded video file
 */
export const downloadInstagramReel = async (instagramReelUrl, updateMessage) => {
	await updateMessage(`Downloading...`);

	// Create a temporary directory for downloads
	const downloadDir = path.join(os.tmpdir(), 'instagram-downloads-' + Date.now());
	if (!fs.existsSync(downloadDir)) {
		fs.mkdirSync(downloadDir);
	}


	// Launch the browser
	const browser = await chromium.launch({
		headless: true
	});

	// Create a new context with download preferences
	const context = await browser.newContext({
		acceptDownloads: true,
		viewport: { width: 1280, height: 3800 },
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
		deviceScaleFactor: 1,
		hasTouch: false
	});

	// Create a new page
	const page = await context.newPage();
	// After important steps
	//await page.screenshot({ path: `debug-${Date.now()}.png` });
	// Add at the beginning after creating the page
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

	try {
		// Navigate to sssinstagram.com
		await updateMessage(`open portal....`);
		await page.goto('https://sssinstagram.com/');

		// Wait for the page to load completely
		await page.waitForLoadState('networkidle');

		// Find the input field and enter the Instagram reel URL
		await updateMessage(`enter the key.....`);
		await page.fill('input[type="text"]', instagramReelUrl);

		// Click the download button (usually there's a submit button after the input)
		await updateMessage(`sending information......`);
		await page.click('button[type="submit"]');

		// Wait for the download button to appear
		await updateMessage(`waiting for response.......`);
		await humanDelay(1000, 1500)
		// Wait for the page to load completely
		await page.waitForLoadState('networkidle');

		// Create a promise that resolves when either selector appears
		await Promise.race([
			page.waitForSelector(DOM_DOWNLOAD_BUTTON, { timeout: 20_000 }),
			page.waitForSelector('.error-message', { timeout: 20_000 })
		]);

		// Check if error message exists
		const errorExists = await page.locator('.error-message').count() > 0;

		if (errorExists) {
			// Get the error message text
			const errorMessage = await page.locator('.error-message').textContent();
			updateMessage(errorMessage)
			return Promise.reject(errorMessage)
		}

		// Count download buttons
		// Wait for the page to load completely
		await page.waitForLoadState('networkidle');
		await humanDelay(1000, 1050);
		const downloadButtonCount = await page.locator(DOM_DOWNLOAD_BUTTON).count();

		let caption = await getCaption(page)
		caption = `There were ${downloadButtonCount} files\n\n${caption}`

		await updateMessage(`Found ${downloadButtonCount} files to download...`);
		// Array to store all downloaded file paths
		const downloadedFiles = [];

		for (let i = 0; i < downloadButtonCount; i++) {
			await updateMessage(`Downloading file ${i + 1} of ${downloadButtonCount}...`);

			// Set up download handler
			const downloadPromise = page.waitForEvent('download');

			// Get the specific download button and click it
			const downloadButton = await page.locator(DOM_DOWNLOAD_BUTTON).nth(i);
			await downloadButton.click();

			// Wait for download to start
			const download = await downloadPromise;

			// Get the suggested filename from the download (which should have the correct extension)
			const suggestedFilename = await download.suggestedFilename();
			const fileExtension = path.extname(suggestedFilename) || '.mp4'; // Default to .mp4 if no extension

			// Generate unique filename with original extension
			const timestamp = Date.now() + i;
			const downloadPath = path.join(downloadDir, `instagram_content_${timestamp}${fileExtension}`);

			// Save the downloaded file
			await download.saveAs(downloadPath);
			downloadedFiles.push(downloadPath);

			await humanDelay(500, 1050);
		}

		await updateMessage(`All files were downloaded..........`);
		// Set up download handler
		//const caption = await getText(page)
		return {
			files: downloadedFiles,
			caption
		};

	} catch (error) {
		console.error('Error during download process:', error.message);
		throw error;
	} finally {
		// Close the browser
		await browser.close();
	}
}

