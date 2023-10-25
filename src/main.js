import fs from 'fs';
import generateToken from './captchan/utils/generateToken.js';
import Checklist from 'checklist-js';
import axios from 'axios';
import cheerio from 'cheerio';
import captchanSolver from './captchan/captchas.io.axios.js';
import { KeyValueStore } from 'crawlee';
//import parseTables from './parsers/parseTables.js';
import ProxyRotator from 'proxy-rotator-js'
import dotenv from 'dotenv';
dotenv.config();

// get the enviroment variables
let twoCaptchaApiKey = process.env.CAPTCHA_SOLVER_API_KEY;
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'
let siteKey = '6LduoHoaAAAAAIydB9j8ldHtqeuHnPfiSgSDeVfZ'

// create proxy rotator
let proxies = new ProxyRotator( './storage/proxies/proxyscrape_premium_http_proxies.txt');

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

// make eqeust to get cookie and javax.faces.ViewState
let response = await axios.get(domain);
// console.log('response: ', response);

// get the javax.faces.ViewState
let javax_faces_ViewState = response.data
    .match(/id="j_id1:javax.faces.ViewState:0" value="(.*)"/)[1]    
    .split('"')[0]
    .trim();
console.log('javax_faces_ViewState: ', javax_faces_ViewState);

// solve captchan
let token = await captchanSolver(domain, siteKey, twoCaptchaApiKey, { 
    debug: true,
    proxy: proxies.next(),
    proxytype: 'http'
});
console.log('captcha solved: ', token);

//let token = generateToken();
 
cedula = '0400558842';
let postData = {
    'frmBusquedaPublica': "frmBusquedaPublica",
    'frmBusquedaPublica:txtCedula':	cedula,
    'g-recaptcha-response':	token,
    'frmBusquedaPublica:btnBuscar':	"",
    'javax.faces.ViewState': javax_faces_ViewState,
}

response = await axios.post(domain, postData, {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': response.headers['set-cookie'][0],
    },
    //proxy: proxies.next(),
});
console.log('response: ', response.data);

/*
const $ = cheerio.load(response.data);
let tables = $('table');
console.log('tables: ', tables);
// get the text of the table tag
let tableText = tables.first().text()
    .trim().replace(/\s\s+/g, ' ');
// if there was an 
if( tableText  === 'Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu número de cédula:' ) {
    console.log(`could not find cedula: ${cedula}`);
} else if( tableText.includes('Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda') ) { 
    console.log(`cedula: ${cedula} no consta en el Registro Social`);
    // save data
    await store.setValue(cedula, { tableText });
    //check cedula
    ckls.check(cedula);
} else {
    // get the data from the page
    let data = parseTables(tables);
    console.log(`cedula: ${cedula} consta en el Registro Social`);
    console.log(data);
    // save data
    await store.setValue(cedula, data);
    //check cedula
    ckls.check(cedula);
} 

cedula = ckls.next();




/*
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

