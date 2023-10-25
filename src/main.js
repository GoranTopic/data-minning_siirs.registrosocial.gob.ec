import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';
import ProxyRotator from 'proxy-rotator-js'
import { KeyValueStore } from 'crawlee';
import { chromium } from 'playwright';
import captchanSolver from './captchan/captchas.io.js';
import parseTables from './parsers/parseTables.js';
import dotenv from 'dotenv';
dotenv.config();

// get the enviroment variables
let captchanKey = process.env.CAPTCHA_SOLVER_API_KEY
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'


slavery({
    host: 'localhost', // '192.168.50.239',
    port : 3000,
    numberOfSlaves: 50,
}).master(async master => {
    // number
    
    let cedula_prefix = process.argv[2];
    // let get the phone number from the params passed
    console.log('reading cedulas starting with: ', cedula_prefix);
    if(!cedula_prefix){
        console.log('Please enter a number from 01 - 24 or 30');
        process.exit(1);
    }

    // create proxy rotator
    let proxies = new ProxyRotator( './storage/proxies/proxyscrape_premium_http_proxies.txt');
    // read cedulas
    let cedulas = fs.readFileSync(`./storage/cedulas/cedulas_${cedula_prefix}.txt`, 'utf8').split('\n');
    // open the key value store
    const store = await KeyValueStore.open(`siirs_${cedula_prefix}`);
    // create checklist
    let checklist = new Checklist(cedulas, { 
        path: `./storage/checklists/`,
        name: `cedulas_${cedula_prefix}`
    });
    // get new cedula
    let cedula = checklist.next();
    // send cedula to slave
    while (cedula) {
        let slave = await master.getIdle();
        // set up browser if it was not set up
        let hasBrowser = await slave.has_done('browser');
        if(!hasBrowser || slave['count'] > 50) {
            console.log('setting up browser');
            slave.run( proxies.next(), 'browser')
            slave['count'] = 0;
        }else{
            // run scrape
            slave['count']++;
            let result = slave
                .run(cedula, 'cedula')
                .then( async ({ cedula, data }) =>  {
                    console.log(`${cedula}: `, data);
                    // save data
                    await store.setValue(cedula, data);
                    // mark cedula as done
                    checklist.check(cedula);
                    console.log(`cedula ${cedula} checked, ${checklist._values.length}/${checklist.missingLeft()} left`);
                })
                .catch( error => { console.log(`${cedula}: `, error); });
            // get new cedula
            cedula = checklist.next();
        }
    }
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
            headless: true,
            proxy: { server: 'http://' + proxy }
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
        } else if( tableText
            .includes('Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu n_mero de c_dula') ) {
            // return empty object
            throw new Error('captcha not solved');
        }else {
            // get the data from the page
            data = await parseTables(tables);
        }
        // return the data
        return { cedula, data };
    }
});

