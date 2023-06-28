
import { io } from "socket.io-client";
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import scrap_webpage from './scrap_website.js'  

// Start workers and listen for messages containing notifyRequest
let numCPUs = availableParallelism();
//numCPUs = 1;

if (cluster.isPrimary) {
    // make workers
    for (let i = 0; i < numCPUs; i++)
        cluster.fork();
    // add event listener to workers
    for(const id in cluster.workers) 
        cluster.workers[id].on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    // add event listener to workers
    for(const id in cluster.workers){
        cluster.workers[id].on('online', () => { console.log(`worker ${id} is online`) });
    }
}else{
    // create worker with each worker socket io connection
    const socket = io("ws://localhost:3003");
    // send a message to the server
    socket.emit("hello from client", 5, "6", { 7: Uint8Array.from([8]) });
    // receive a message from the server
    socket.on("hello from server", (...args) => {
        console.log(args); // 5, "6", { 7: Uint8Array.from([8]) }
        console.log('this ran')
        // ...
    });
    // Workers can share any TCP connection
    //use message-js to comunicate with master
}


