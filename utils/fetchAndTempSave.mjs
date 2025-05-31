import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const fetchAndTempSave = (url, filename) => {
	const filePath = path.join(os.tmpdir(), filename);

	// Create write stream
	const fileStream = fs.createWriteStream(filePath);

	return new Promise((resolve, reject) => {
		// Make the HTTPS request
		https.get(url, (response) => {
			// Handle redirects
			if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
				fileStream.close();
				// Follow the redirect
				fetchAndTempSave(response.headers.location)
					.then(resolve)
					.catch(reject);
				return;
			}

			// Check for error status codes
			if (response.statusCode !== 200) {
				fileStream.close();
				reject(new Error(`Failed to download file: HTTP status code ${response.statusCode}`));
				return;
			}

			// Pipe the response to the file
			response.pipe(fileStream);

			// Resolve when download completes
			fileStream.on('finish', () => {
				fileStream.close();
				resolve(filePath);
			});

			// Handle file write errors
			fileStream.on('error', (err) => {
				fileStream.close();
				reject(err);
			});
		}).on('error', (err) => {
			fileStream.close();
			reject(err);
		});
	});
}

export default fetchAndTempSave
