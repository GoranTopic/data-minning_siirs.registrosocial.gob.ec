import puppeteer from 'puppeteer';

const scrap_webpage = async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    await page.goto('https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf');
}

export default scrap_webpage;
