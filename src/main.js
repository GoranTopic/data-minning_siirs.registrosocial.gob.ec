import cluster from 'node:cluster';
import http from 'node:http';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import scrap_webpage from './scrap_website.js'  

// Start workers and listen for messages containing notifyRequest
let numCPUs = availableParallelism();
numCPUs = 1

if (cluster.isPrimary) {
    // make workers
    for (let i = 0; i < numCPUs; i++) cluster.fork();
    // add event listener to workers
    for(const id in cluster.workers){
        cluster.workers[id].on('message', msg => {
            console.log(`Master ${process.pid} received message from worker ${id}: ${msg.cmd}`);
            if(msg.cmd == 'isOnline'){
                console.log(`worker ${id} is online`);
                // send message to worker
                cluster.workers[id].send({ cmd: '0916576796' });
            }
        });
        // add event listener to workers
        cluster.workers[id].on('error', (code, id) => {
            console.log(`worker ${code} is dead`);
        });
    }

    // add event listener to workers
    for(const id in cluster.workers) 
        cluster.workers[id].on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });

    // add event listener to workers
    for(const id in cluster.workers){
        //cluster.workers[id].on('online', () => { console.log(`worker ${id} is online`) });
    }
}else{
    // Workers can share any TCP connection
    process.send({ cmd: 'isOnline' });
    process.on('message', msg => {
        console.log(`Worker ${process.pid} received message from master: ${msg.cmd}`);
        console.log(msg);
    });

}

