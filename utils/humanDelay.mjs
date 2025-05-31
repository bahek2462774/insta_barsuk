/**
 * !!! Deprecated !!!
 */

async function humanDelay(min = 50, max = 2000) {
	const delay = Math.floor(Math.random() * (max - min) + min);
	await new Promise(resolve => setTimeout(resolve, delay));
}

export default humanDelay