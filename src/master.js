import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';
import ProxyRotator from 'proxy-rotator-js'
import { KeyValueStore } from 'crawlee';

slavery({
    host: 'localhost', // '192.168.50.239',
    port : 3000,
}).master(async master => {
    // number
    let number = '03';
    // create proxy rotator
    let proxies = new ProxyRotator( './storage/proxies/proxyscrape_premium_http_proxies.txt');
    // read cedulas
    let cedulas = fs.readFileSync(`./storage/cedulas/cedulas_${number}.txt`, 'utf8').split('\n');
    // open the key value store
    const store = await KeyValueStore.open(`siirs_${number}`);
    // create checklist
    let checklist = new Checklist(cedulas, { 
        path: `./storage/checklists/`,
        name: `cedulas_${number}`
    });
    // get new cedula
    let cedula = checklist.next();
    // send cedula to slave
    while (cedula) {
        let slave = await master.getIdle();
        // set up browser if it was not set up
        let hasBrowser = await slave.has_done('browser');
        if(!hasBrowser || slave['count'] > 5) {
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
});

