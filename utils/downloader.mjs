
import { v4 as uuidv4 } from 'uuid';
import fetchAndTempSave from './fetchAndTempSave.mjs'

const getUriOrOrigin = url => {
	const urlInstance = new URL(url)
	const uriSearchParam = urlInstance.searchParams.get('uri')
	return uriSearchParam ? uriSearchParam : url
}

const getLinkToFile = item => {
	const sdPath = item.sd?.url
	if (sdPath) return getUriOrOrigin(sdPath)

	const urlPath = item.url?.[0]?.url
	if (urlPath) return getUriOrOrigin(urlPath)

	const imagePath = item.thumb
	if (imagePath) return getUriOrOrigin(imagePath)

	return false
}

function getExtensionFromUrl(url) {
	// This regex looks for a period followed by 2-4 letters/numbers before any query parameters
	const extensionRegex = /\.([a-zA-Z0-9]{2,4})(?:\?|$|&|#)/;
	const match = url.match(extensionRegex);

	if (match && match[1]) {
		return match[1].toLowerCase();
	}

	return null;
}

const downloadSingle = item => {
	const urlToDownload = getLinkToFile(item)
	if (urlToDownload) {
		const type = getExtensionFromUrl(urlToDownload)
		const fileName = uuidv4() + `.${type}`
		return fetchAndTempSave(urlToDownload, fileName)
	} else {
		return Promise.resolve('')
	}
}

const getCaption = items => {
	return items?.[0]?.meta?.title ?? 'no-caption'
}

const downloader = async (itemsArray) => {
	try {
		const downloadPromises = itemsArray.map(item => downloadSingle(item));
		const files = await Promise.all(downloadPromises);
		return { files, caption: getCaption(itemsArray) }
	} catch {
		console.log('downloader error: 504')
		return Promise.reject('reject error: downloader error: 504')
	}
}

export default downloader