import fs from 'fs';
import Checklist from 'checklist-js';
import { chromium } from 'playwright';
//import captchanSolver from './captchan/captchas.io.exploit.js';
import captchanSolver from './captchan/captchas.io.js';
import { KeyValueStore } from 'crawlee';
import parseTables from './parsers/parseTables.js';
import generateToken from './utils/generateToken.js';

import dotenv from 'dotenv';
dotenv.config();
//import parsteTable from './parser/parseTable.js';

// get the enviroment variables
let twoCaptchaApiKey = process.env.CAPTCHA_SOLVER_API_KEY;
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

// launch playwrigth
const browser = await chromium.launch({
	headless: false,
	slowMo: 50,
});

// make a new context
let context = await browser.newContext()

// get the context request
let contextRequets = context.request;

// open a new page
const page = await context.newPage();

// numeros
let number = '03';

// get cedulas
let cedulas = fs.readFileSync(`./storage/cedulas/cedulas_${number}.txt`, 'utf8').split('\n');

// open the key value store
const store = await KeyValueStore.open(`siirs_${number}`);

// make directory
fs.mkdirSync(`./storage/checklist/cedulas_${number}`, { recursive: true });

// create checklist
let ckls = new Checklist(cedulas, { 
    path: `./storage/checklist/cedulas_${number}`
});

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
	let result = await captchanSolver(page, twoCaptchaApiKey);
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

// this code was my attpemt to find if the captcha was being checked on the server side
/* 
    let fakeToken = generateToken();
	console.log('fake captcha token:', fakeToken);


let javax_faces_ViewState = await page.evaluate( () => 
    document.getElementById("j_id1:javax.faces.ViewState:0").value
);

console.log('javax_faces_ViewState: ', javax_faces_ViewState);

//
let response = await contextRequets.post(domain, {
    'rmBusquedaPublica': 'frmBusquedaPublica',
    'frmBusquedaPublica:txtCedula': '0300550316',
    'g-recaptcha-response': fakeToken,
    'frmBusquedaPublica:btnBuscar': '',
    'javax.faces.ViewState': javax_faces_ViewState,
})
let body = await response.body();
console.log('response: ', body.toString());

*/






