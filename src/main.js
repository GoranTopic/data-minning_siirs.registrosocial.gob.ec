import fs from 'fs';
import Checklist from 'checklist-js';
import ProxyRotator from 'proxy-rotator-js'
import { KeyValueStore } from 'crawlee';
import axios from 'axios';
import captchanSolver from './captchan/captchas.io.axios.js';
import dotenv from 'dotenv';
import parseTables from './parsers/parseTables.js';
import slavery from 'slavery-js';
dotenv.config();

// get the enviroment variables
let captchanKey = process.env.CAPTCHA_SOLVER_API_KEY
let domain = 'https://siirs.registrosocial.gob.ec/pages/publico/busquedaPublica.jsf'
let siteKey = '6LduoHoaAAAAAIydB9j8ldHtqeuHnPfiSgSDeVfZ'

slavery({
    host: 'localhost', // '192.168.50.239',
    port : 3000,
    numberOfSlaves: 2,
}).master(async master => {
    // get which cedulas we are reading from
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
    let cedulas = fs.readFileSync(`./storage/cedulas/cedulas_${cedula_prefix}.txt`, 'utf8')
        .split('\n');
    // open the key value store
    console.log(`opening key value store: siirs_${cedula_prefix}`);
    const store = await KeyValueStore.open(`siirs_${cedula_prefix}`);
    console.log(`key value store opened: siirs_${cedula_prefix}`);
    // make directory
    try{
        fs.mkdirSync(`./storage/checklists`);
    }catch(e){}
    // create checklist
    let checklist = new Checklist(cedulas, { 
        path: './storage/checklists/',
        name: `cedulas_${cedula_prefix}`,
    });
    // get new cedula
    let cedula = checklist.next();
    // send cedula to slave
    while (cedula) {
        let slave = await master.getIdle();
        // run the slave with the cedula and proxy
        let result = slave.run({ 
            proxy: proxies.next(),
            cedula: checklist.next(),
        }).then( async ({ cedula, data }) =>  {
            console.log(`${cedula}: `, data);
            // save data
            await store.setValue(cedula, data);
            // mark cedula as done
            checklist.check(cedula);
            console.log(`cedula ${cedula} checked, ${checklist._values.length}/${checklist.missingLeft()} left`);
        }).catch( error => { console.log(`${cedula}: `, error); });
    }
}).slave( async ({ proxy, cedula }, slave ) => {
    // make eqeust to get cookie and javax.faces.ViewState
    console.log(`making request to ${domain} with proxy ${proxy}`);
    let response = await axios.get(domain, {
        proxy: {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: proxy.split(':')[1],
        },
    });

    // get the javax.faces.ViewState
    let javax_faces_ViewState = response.data
        .match(/id="j_id1:javax.faces.ViewState:0" value="(.*)"/)[1]    
        .split('"')[0]
        .trim();

    // solve captchan
    let token = await captchanSolver(domain, siteKey, process.env.CAPTCHA_SOLVER_API_KEY, { 
        debug: true,
        proxy: proxy,
        proxytype: 'http'
    });

    // genreate fake proxy
    //let token = generateToken();

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
        }, // add the proxy to the axios request
        proxy: {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: proxy.split(':')[1],
        },
    });

    let data = parseTables(response.data);
    // if there was an 
    if( data.data  === 'Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu número de cédula:' )
        throw new Error('could not get cedula');

    return { cedula, data };
});
