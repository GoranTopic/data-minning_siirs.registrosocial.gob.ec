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
await page.goto(domain);

// set listener for captcha audio
set_captchan_audio_listener(page, async response => {
    console.log('response from google captcha');
    console.log(response);
});

// play the audio captcha
await play_captchan_audio(page);
