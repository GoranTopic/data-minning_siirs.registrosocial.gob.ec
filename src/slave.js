import { chromium } from 'playwright';
import captchanSolver from './captchan/captchas.io.js';
import dotenv from 'dotenv';
import parseTables from './parsers/parseTables.js';
import slavery from 'slavery-js';
dotenv.config();

// get the enviroment variables
let captchanKey = process.env.CAPTCHA_SOLVER_API_KEY
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'

slavery({
    host: 'localhost', // '192.168.50.239',
    port : 3000,
    numberOfSlaves: 1
}).slave( {
    'browser': async (proxy, slave ) => {
        let browser = slave.get('browser');
        if(browser) {
            console.log('closing browser');
            await browser.close();
        }
        console.log('making browser');
        // launch playwrigth
        browser = await chromium.launch({
            headless: false,
            //proxy: { server: 'http://' + proxy }
        });
        // open a new page
        let page = await browser.newPage();
        
        // page on the slave
        slave.set('browser', browser)
        slave.set('page', page)
    },
    'cedula': async (cedula, slave) => {
        // get the page from the slave
        let page = slave.get('page');
        if(!page) throw new Error('no page on the slave');
        // go to the domain
        await page.goto(domain);
        // get text input with id frmBusquedaPublica:txtCedula
        let textInput = await page.$('#frmBusquedaPublica\\:txtCedula');
        // set the value of the text input
        await textInput.fill(cedula);
        // salve captchan
        let result = await captchanSolver(page, captchanKey, { debug: true });
        if(result === false) throw new Error('captcha not solved');
        else console.log('captcha solved');
        // click on the submit button with the id frmBusquedaPublica:btnBuscar
        await page.click('#frmBusquedaPublica\\:btnBuscar');
        // wait for the page to load
        await page.waitForLoadState('networkidle');
        // get the text of the table tag
        let tables = await page.$$('table')
        // get the text of the table tag	
        let data;
        let tableText = await tables[0].innerText();
        if( tableText
            .includes('Usted no consta en el Registro Social, en los próximos meses el Registro Social visitará su vivienda') ) {
            // return empty object
            data = 'no consta en el registro social';
        } else {
            // get the data from the page
            data = await parseTables(tables);
        }
        // return the data
        return { cedula, data };
    }
});

