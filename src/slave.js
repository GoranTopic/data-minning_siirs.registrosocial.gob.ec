import { chromium } from 'playwright';
import captchanSolver from './captchan/captchas.io.js';
import wait from 'waiting-for-js';
import dotenv from 'dotenv';
import parseTables from './parsers/parseTables.js';
import slavery from 'slavery-js';
dotenv.config();

// get the enviroment variables
let captchanKey = process.env.CAPTCHA_SOLVER_API_KEY
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

// launch playwrigth
const browser = await chromium.launch({
	headless: true,
	slowMo: 50,
});

// open a new page
const page = await browser.newPage();

slavery({
	numberOfSlaves: 50,
}).slave(async (cedula, salve) => {
	// go to the domain
	await page.goto(domain);

	// get text input with id frmBusquedaPublica:txtCedula
	let textInput = await page.$('#frmBusquedaPublica\\:txtCedula');

	// set the value of the text input
	await textInput.fill(cedula);

	// salve captchan
	let result = await captchanSolver(page, captchanKey);
	if(result === false) throw new Error('captcha not solved');
	else console.log('captcha solved: ', result);

	// click on the submit button with the id frmBusquedaPublica:btnBuscar
	await page.click('#frmBusquedaPublica\\:btnBuscar');

	// wait for the page to load
	await page.waitForLoadState('networkidle');

    // get the text of the table tag
    let tables = await page.$$('table')
    // get the text of the table tag	
    let tableText = await tables[0].innerText();

    if( tableText
        .includes('Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda') ) {
        // return empty object
        return {};
    } else {
        // get the data from the page
        let data = await parseTables(tables);
        // return the data
        return data;
    }
});
