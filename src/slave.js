import { chromium } from 'playwright';
import twoCaptchanSolver from './captchan/twoCaptchanSolver.js';
import wait from 'waiting-for-js';
import dotenv from 'dotenv';
import slavery from 'slavery-js';
dotenv.config();

// get the enviroment variables
let twoCaptchaApiKey = process.env.TWO_CAPTCHA_API_KEY;
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

// launch playwrigth
const browser = await chromium.launch({
	headless: true,
	slowMo: 50,
});

// open a new page
const page = await browser.newPage();

slavery({
	numberOfSlaves: 1,
}).slave(async cedula => {
	// go to the domain
	await page.goto(domain);

	// salve captchan
	let result = await twoCaptchanSolver(page, twoCaptchaApiKey);
	console.log('result', result);

	// get text input with id frmBusquedaPublica:txtCedula
	let textInput = await page.$('#frmBusquedaPublica\\:txtCedula');

	// set the value of the text input
	await textInput.fill(cedula);

	// click on the submit button with the id frmBusquedaPublica:btnBuscar
	await page.click('#frmBusquedaPublica\\:btnBuscar');

	// wait for the page to load
	await wait.for.time(2000);
});
