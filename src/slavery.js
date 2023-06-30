import Master from './sever/Master.js';
import Slave from './client/Slave.js';

import cluster from 'node:cluster';
import process from 'node:process';
import { availableParallelism } from 'node:os';


class Slavery {
    constructor() {
        this.master_process = null;
        this.salve_process = null;
        this.number_of_slaves = null;
    }   

    init( options={}) {
        this.options = options;
        if(cluster.isPrimary){
            // get number of slaves
            let { numberOfSlaves } = options ;
            // get available cores
            let available_cores = availableParallelism();
            // if number of slaves is not set
            this.number_of_slaves = numberOfSlaves || available_cores;
            // if number of slaves is more than available cores
            if(this.number_of_slaves > available_cores)
                console.error(
                    new Error(`number of workers is more than available cores, available cores: ${available_cores}`)
                )
            // calculate number of slaves
            this._calc_available_cores();
        }
        return this;
    }

    master( callback ) {
        // if it is primary and this function is called
        if (cluster.isPrimary) {
            // calculate number of slaves
            this._calc_available_cores();
            // make master node
            process.env.type = 'master';
            // make slave nodes
            cluster.fork();
            // set type to primary again
            process.env.type = 'primary';
        }
        // if it is the master node and this function is called
        if(process.env.type === 'master') {
            //console.log('master created ', cluster.worker.id)
            // create a master node
            this.master_process = new Master( this.options );
            // run master code
            this.master_process.run(callback);
        }
        // return object
        return this;
    }

    // make slave nodes
    slave( callback ) {
        // if it is primary process and this function is called
        // create node slaves
        if (cluster.isPrimary) {
            // calculate number of slaves
            this._calc_available_cores();
            // make slave nodes
            for(let i = 0; i < this.number_of_slaves; i++){
                // set type to slave
                process.env.type = 'slave';
                // make slave process
                cluster.fork({ type: 'slave'});
                // set type to primary again
                process.env.type = 'primary';
            }
        }
        // if it is the master node and this function is called
        if(process.env.type === 'slave') {
            //console.log('slave created ', cluster.worker.id)
            // create a master node
            this.salve_process = new Slave( this.options );
            // add event listener to workers
            for(const id in cluster.workers)
                cluster.workers[id].on('online', () => { 
                    console.log(`worker ${id} is online`)
                });
            for(const id in cluster.workers) 
                cluster.workers[id].on('exit', (worker, code, signal) => {
                    console.log(`worker ${worker} exited`);
                });        
            // run master code
            this.salve_process.run(callback);
        }
        return this;
    }

    // calculate number of slaves
    _calc_available_cores() {
        // get number of slaves left
        this.number_of_slaves = this.number_of_slaves - Object.values(cluster.workers).length
    }
}

function make_slavery ( options={} ){
    // add event listener to workers
    const slavery = new Slavery();
    // initialize
    slavery.init( options );
    // return object
    return slavery;
}

export default make_slavery;
