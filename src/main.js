import slavery from './slavery.js';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';

let options = {
    numberOfSlaves: 10,
    port: 3003,
    host: 'localhost',
}

let s = slavery(options);



// define the master
s.master( async master => {
    // master
    // console.log('Master is running');
    // define the master
    master.on('connected', () => { console.log(`worker is online`) });
    // recive send event from slave
    master.on('send', (data) => { 
        console.log('send event from slave');
        console.log(data)
    });
    // wait for connection
    await master.untilConnected(9); 
    // send event to slaves
    master.emit('send', 'hello from master' );
    // get slave 
    let slave = master.getSlaves()[1];
    // get the return value from slave
    console.log(slave.return);
})

// define the slave
s.slave( async slave => {
    // define the salve
    //console.log('print from slave');
    slave.on('connected', () => console.log(`worker is online`) );
    console.log('slave is running');
    await slave.untilConnected();
    console.log('slave is connected');
    //slave.emit('send', w => { message: 'hello from slave' });
    // return
    return { result: 'huge suceess' };
})


/*
if (cluster.isPrimary) {
    console.log(Object.values(cluster.workers).length);
    console.log(`avialable parallelism: ${availableParallelism()}`);
}
*/

