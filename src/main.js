import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';
import { chromium } from 'playwright';
import twoCaptchanSolver from './captchan/twoCaptchanSolver.js';
import dotenv from 'dotenv';
dotenv.config();

// get the enviroment variables
let twoCaptchaApiKey = process.env.TWO_CAPTCHA_API_KEY;
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

// launch playwrigth
const browser = await chromium.launch({
	headless: false,
	slowMo: 50,
});

// open a new page
const page = await browser.newPage();

// get cedulas
let cedulas = fs.readFileSync('./storage/cedulas/cedulas_03.txt', 'utf8').split('\n');

// create checklist
let ckls = new Checklist(cedulas);

// get new cedula
let cedula = ckls.next();

// send cedula to slave
while (cedula) {

	// go to the domain
	await page.goto(domain, { timeout: 1000000 });

	// salve captchan
	let result = await twoCaptchanSolver(page, twoCaptchaApiKey);
	if(result === false) 
		throw new Error('captcha not solved');
	else console.log('captcha solved: ', result);

	// get text input with id frmBusquedaPublica:txtCedula
	let textInput = await page.$('#frmBusquedaPublica\\:txtCedula');

	// set the value of the text input
	await textInput.fill(cedula);

	// click on the submit button with the id frmBusquedaPublica:btnBuscar
	await page.click('#frmBusquedaPublica\\:btnBuscar');

	// wait for the page to load
	await page.waitForLoadState('networkidle');

	ckls.check(cedula);
	// get the text of the table tag
	let tableText = await page.$('table')
	// get the text of the table tag	
	tableText = await tableText.innerText();

	// if test message containes the message 'Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda'
	if( tableText
		.includes('Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda') ) {
		// check cedula
		cedula = ckls.next();
	} else {
		// save the text of the table tag
		fs.writeFileSync(`./storage/cedulas/${cedula}.txt`, tableText);
		break;
	}
}



