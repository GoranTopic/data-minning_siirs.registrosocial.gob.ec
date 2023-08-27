import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';
import { chromium } from 'playwright';
import twoCaptchanSolver from './captchan/twoCaptchanSolver.js';
import { KeyValueStore } from 'crawlee';
import parseTables from './parsers/parseTables.js';
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

// open the key value store
const store = await KeyValueStore.open('siirs');

// create checklist
let ckls = new Checklist(cedulas);

// get new cedula
let cedula = ckls.next();

// send cedula to slave
while (cedula) {
	// go to the domain
	await page.goto(domain, { timeout: 1000000 });

	// write cedula in search input
	// get text input with id frmBusquedaPublica:txtCedula
	let textInput = await page.$('#frmBusquedaPublica\\:txtCedula');
	// set the value of the text input
	await textInput.fill(cedula);

	// salve captchan
	let result = await twoCaptchanSolver(page, twoCaptchaApiKey);
	if(result === false) 
		throw new Error('captcha not solved');
	else console.log('captcha solved: ', result);


	// click on the submit button with the id frmBusquedaPublica:btnBuscar
	await page.click('#frmBusquedaPublica\\:btnBuscar');

	// wait for the page to load
	await page.waitForLoadState('networkidle');

	// get the text of the table tag
	let tables = await page.$$('table')
	// get the text of the table tag	
	let tableText = await tables[0].innerText();

	// if test message containes the message 'Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda'
	if( tableText
		.includes('Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda') ) {
		// check cedula
		cedula = ckls.next();
	} else {
		// get the data from the page
		let data = await parseTables(tables);
		console.log(data);
		// save data
		await store.setValue(cedula, data);
	}
	// check cedula
	ckls.check(cedula);
	console.log('checked: ', cedula);
	// get new cedula
	cedula = ckls.next();
}



