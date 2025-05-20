import { chromium } from 'playwright-core'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * Downloads an Instagram reel using sssinstagram.com
 * @param {string} instagramReelUrl - Full URL to the Instagram reel
 * @returns {Promise<string>} - Path to the downloaded video file
 */
export const downloadInstagramReel = async (instagramReelUrl, updateMessage) => {
	updateMessage(`Preparing to download reel from URL: ${instagramReelUrl}...`);

	// Create a temporary directory for downloads
	const downloadDir = path.join(os.tmpdir(), 'instagram-downloads-' + Date.now());
	if (!fs.existsSync(downloadDir)) {
		fs.mkdirSync(downloadDir);
	}

	// Setup browser executable path for Lambda environment
	const executablePath = process.env.LAMBDA_TASK_ROOT
		? path.join(process.env.LAMBDA_TASK_ROOT, 'chromium')
		: undefined;

	// Launch the browser
	const browser = await chromium.launch({
		headless: true,
		executablePath
	});

	// Create a new context with download preferences
	const context = await browser.newContext({
		acceptDownloads: true,
		viewport: { width: 1280, height: 800 }
	});

	// Create a new page
	const page = await context.newPage();

	try {
		// Navigate to sssinstagram.com
		updateMessage('Navigating to magic site .com...');
		await page.goto('https://sssinstagram.com/');

		// Wait for the page to load completely
		await page.waitForLoadState('networkidle');

		// Find the input field and enter the Instagram reel URL
		updateMessage('Entering Instagram reel URL...');
		await page.fill('input[type="text"]', instagramReelUrl);

		// Click the download button (usually there's a submit button after the input)
		updateMessage('Submitting URL...');
		await page.click('button[type="submit"]');

		// Wait for the download button to appear
		updateMessage('Waiting for download options to appear...');
		await page.waitForSelector('.button__download', { timeout: 3000 });

		// Set up download handler
		const downloadPromise = page.waitForEvent('download');

		// Click the download button
		updateMessage('Clicking download button...');
		await page.click('.button__download');

		// Wait for download to start
		const download = await downloadPromise;

		// Get suggested filename
		const suggestedFilename = download.suggestedFilename();
		const timestamp = Date.now();
		const downloadPath = path.join(downloadDir, suggestedFilename || `instagram_reel_${timestamp}.mp4`);

		updateMessage(`Saving file to: ${downloadPath}`);

		// Save the downloaded file
		await download.saveAs(downloadPath);

		updateMessage('Download completed successfully!');
		return downloadPath;

	} catch (error) {
		console.error('Error during download process:', error.message);
		throw error;
	} finally {
		// Close the browser
		await browser.close();
	}
}

