/**
 * !!! Deprecated !!!
 */
import { chromium } from 'playwright-core'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Enable Playwright debug logs
//process.env.DEBUG = 'playwright:*';


const DOM_DOWNLOAD_BUTTON = '.button__download'
const DOM_CAPTION = '.output-list__caption'
const MEDIA_CONTENT = '.media-content'
const VIDEO = '.tags__item--video'

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

	// block some request
	//await context.route(/google-analytics/, route => route.abort());
	//await context.route(/.css$/, route => route.abort());
	//await context.route(/doubleclick/, route => route.abort());

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
		caption = `files: ${downloadButtonCount}\n\n${caption}`

		await updateMessage(`Found ${downloadButtonCount} files to download...`);
		// Array to store all downloaded file paths
		const downloadedFiles = [];
		//const downloadPromises = [];

		//const mediaContents = await page.locator(MEDIA_CONTENT).all();


		for (let i = 0; i < downloadButtonCount; i++) {
			await updateMessage(`Downloading file ${i + 1} of ${downloadButtonCount}...`);
			//const videoTagCount = await mediaContents[i].locator(VIDEO).count();


			// Set up download handler
			const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });

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
			//const downloadPath = path.join(downloadDir, `instagram_content_${timestamp}`);

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

export const getUrlToDownloads = async (instagramReelUrl, updateMessage) => {
	await updateMessage(`Downloading...`);

	// Create a temporary directory for downloads
	const downloadDir = path.join(os.tmpdir(), 'instagram-downloads-' + Date.now());
	if (!fs.existsSync(downloadDir)) {
		fs.mkdirSync(downloadDir);
	}


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

	// block some request
	//await context.route(/google-analytics/, route => route.abort());
	//await context.route(/.css$/, route => route.abort());
	//await context.route(/doubleclick/, route => route.abort());

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

		const resultLinks = []

		const medias = await page.locator(MEDIA_CONTENT).all();
		const searchResult = await page.locator('.search-result');
		const html = await searchResult.innerHTML()
		return html
		//return

		//console.log('===== medias.length: ', medias.length, ' ========')

		//for (let i = 0; i < medias.length; i++) {
		//	const button = await medias[i].locator(DOM_DOWNLOAD_BUTTON)
		//	const link = await button.getAttribute('href')
		//	resultLinks.push(processLink(link))
		//}

		//let caption = await getCaption(page)
		//caption = `files: ${downloadButtonCount}\n\n${caption}`


		//return {
		//	files: resultLinks,
		//	caption
		//};

	} catch (error) {
		console.error('Error during download process:', error.message);
		throw error;
	} finally {
		// Close the browser
		await browser.close();
	}
}

