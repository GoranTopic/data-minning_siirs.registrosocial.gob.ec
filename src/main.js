import puppeteer from 'puppeteer';
import play_captchan_audio from './scripts/play_captchan_audio.js';
import set_captchan_audio_listener from './listeners/set_captchan_audio_listener.js';

let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

// launch puppeteer in headeless mode off and with a proxy
let browser = await puppeteer.launch({
    headless: false,
    args: [ ]
});

// open a new page
const page = await browser.newPage();
await page.setRequestInterception(true);


// set request interception to true
// set listener for captcha audio
page.on('request', interceptedRequest => {
    console.log('intercepted request:' + interceptedRequest.url());
    interceptedRequest.continue();
});
/*
set_captchan_audio_listener(page, async response => {
    console.log('response from google captcha');
    console.log(response);
});
*/

// go to the domain
await page.goto(domain);

// play the audio captcha
await play_captchan_audio(page);
