import puppeteer from 'puppeteer';
import fs from 'fs';

export const htmlToPDF = async (htmlFile: string) => {
	// launch a new chrome instance
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	// create a new page
	const page = await browser.newPage();

	// set your html as the pages content
	const html = fs.readFileSync(htmlFile, 'utf8');
	await page.setContent(html, {
		waitUntil: 'domcontentloaded',
	});

	// create a pdf buffer
	const pdfBuffer = await page.pdf({
		format: 'a4',
	});

	// close the browser
	await browser.close();

	return pdfBuffer;
};
