import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';
import { KeyValueStore } from 'crawlee';

slavery()
    .master(async master => {
        // number
        let number = '03';
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
            let result = slave.run(cedula)
                .then( async data =>  {
                    console.log(`${cedula}: `, data);
                    // save data
                    await store.setValue(cedula, data);
                    // mark cedula as done
                    checklist.check(cedula);
                }).catch( error => {
                    console.log(`${cedula}: `, error);
                });
            // get new cedula
            cedula = checklist.next();
        }
    });

