import { io } from "socket.io-client";

// initilized the Slave instance with socket io. try to connect to 
// create worker with each worker socket io connection
class Slave {
    constructor(options={}){
        let { endpoint } = options
        // endpoint to connect to socke.io server
        this.endpoint = endpoint ?? "ws://localhost:3003";
        // has it connected to server?
        this.connected = false;
        // function to run on demand
        this.work = null;
        // is it working
        this.isIdel = true;
        // is it working
        this.isError = false;
        // list of slaves
        this.socket = null;
        // paramters to run with a function
        this.parameters = null
        // initilize
        this.init();
    }

    init(){
        // initilize the socket
        this.socket = io( this.endpoint );
        // sent up funtion that connects to server
        this.socket.on("online", (...args) => {
            this.connected = true;
        });
        // if it disconnects
        this.socket.on("diconnect", (...args) => {
            this.connected = false;
        });
        // set up parameters
        this.socket.on("set parameters", parameters => {
            // add paramters to work
            this.parameters = parameters;
            this.socket.emit("result", { data: true } );
        });
        // set work
        this.socket.on("set work", work => {
            // add paramters to work
            this.work = work;
            this.socket.emit("result", { data: true } );
        });
        // if it sends a function to run
        this.socket.on("work", func => {
            if( func === null && this.work === null) 
                return this.error('no function passes and no function is set in slave')
            if( typeof func === "function" ) 
                // if a func we have a function
                return this.run(func);
            else if( typeof this.work === "function" )
                // if a func we have a function
                return this.run(this.work);
            else
                return this.error('no function to run found')
        });
    }

    // this function profifies a function to run and run it
    async run(func){
        return new Promise( 
            resolve => {
                // start work
                this.isIdel = false;
                // function 
                if(this.params) resolve(func(...this.params));
                else resolve(func());
            })
            .then( result => {
                // 
                this.isIdel = true;
                // send result back to master
                this.socket.emit("result", { data: result } );
            })
            .catch( e => { 
                // isIdel again
                this.isIdel = true;
                // is error too
                this.isError = true;
                // send error back to master
                this.socket.emit("error", { error: e } );
                // print on terminal
                console.error(e);
            })
    }

    error(eStr){
        // if no function passes and no function is set
        let e = new Error(eStr);
        // send error back to master
        this.socket.emit("error", { error: e } );
        // print on terminal
        console.error(e);
        return;

    }

}

export default Slave
