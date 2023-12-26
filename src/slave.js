import axios from 'axios';
import captchanSolver from './captchan/capmonster.js';
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
    numberOfSlaves: 1,
}).slave( async ({ proxy, cedula }, slave ) => {
    // make eqeust to get cookie and javax.faces.ViewState
    console.log(`making request to ${domain} ${ proxy? 'with proxy: ' + proxy : 'without proxy' }`);
    let response = await axios.get(domain, { // commented out proxy
        proxy:  proxy ? {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: proxy.split(':')[1],
        } : undefined,
    })
    // get the javax.faces.ViewState
    let javax_faces_ViewState = response.data
        .match(/id="j_id1:javax.faces.ViewState:0" value="(.*)"/)[1]    
        .split('"')[0]
        .trim();

    // solve captchan
    let token = await captchanSolver(domain, siteKey, process.env.CAPTCHA_SOLVER_API_KEY, { 
        debug: true,
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
        proxy:  proxy ? {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: proxy.split(':')[1],
        } : undefined,
    });

    let data = parseTables(response.data);
    // if there was an 
    if( data.data  === 'Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu número de cédula:' )
        throw new Error('could not get cedula');

    return { cedula, data };
});
