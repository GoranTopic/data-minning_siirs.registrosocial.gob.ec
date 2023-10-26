import axios from 'axios';
import ProxyRotator from 'proxy-rotator-js'


let proxies = new ProxyRotator( './storage/proxies/proxyscrape_premium_http_proxies.txt');
// read cedulas
let proxy = proxies.next();
console.log(`testing proxy ${proxy}`);
// test if proxy is working correctly
let result = await axios.get('https://api.ipify.org?format=json',{
    proxy:{ 
        protocol: 'http',
        host: proxy.split(':')[0],
        port: proxy.split(':')[1],
    }
});


console.log(result.data);
