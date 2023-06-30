import { io } from "socket.io-client";

// initilized the Slave instance with socket io. try to connect to 
// create worker with each worker socket io connection
class Slave {
    constructor(options={}){
        let { host, port } = options
        // endpoint to connect to socke.io server
        this.host = host ?? "localhost";
        this.port = port ?? 3003;
        // endpoint to connect to socke.io server
        this.endpoint = `ws://${this.host}:${this.port}`;
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
        // check if work is idel
        this.socket.on("_is idel", () => {
            this.socket.emit("_result", { data: this.isIdel } );
        });
        // set up parameters
        this.socket.on("_set parameters", parameters => {
            // add paramters to work
            this.parameters = parameters;
            this.socket.emit("_result", { data: true } );
        });
        // set work
        this.socket.on("_set work", work => {
            // add paramters to work
            this.work = work;
            this.socket.emit("_result", { data: true } );
        });
        // if it sends a function to run
        this.socket.on("_work", workStr => {
            let func = eval( "(" + workStr + ")" );
            // check if we have a function to run
            if( func === null && this.work === null) 
                return this.error('no function passes and no function is set in slave')
            if( typeof func === "function" ) 
                // if a func we have a function
                return this.work(func);
            else if( typeof this.work === "function" )
                // if a func we have a function
                return this.work(this.work);
            else
                return this.error('no function to run found')
        });
    }

    // this function is called when a functio is passed form the master
    // through the socket io connection
    async work(callback){
        return new Promise( 
            resolve => {
                // start work
                this.isIdel = false;
                // function 
                if(this.params) resolve(func(...this.params));
                else resolve(func());
            })
            .then( result => {
                // isIdel again
                this.isIdel = true;
                // send result back to master
                this.socket.emit("_result", { data: result } );
            })
            .catch( e => { 
                // isIdel again
                this.isIdel = true;
                // is error too
                this.isError = true;
                // send error back to master
                this.socket.emit("_error", { error: e } );
                // print on terminal
                console.error(e);
            })
    }

    async untilConnected(){
        return new Promise((resolve, reject) => {
            if(this.connected) resolve(this.connected);
            else this.socket.on("online", () => resolve(this.connected));
        });
    }

    //  pass the on function to the socket io connection
    on(event, callback){
        this.socket.on(event, callback);
    }
    emit(event, data){
        this.socket.emit(event, data);
    }

    // this function is in the creation of the slave
    // on another thread
    async run(callback){
        console.log('slave is connected to server:', this.connected);
        // start work
        this.isIdel = false;
        // this rnns the function
        let result = await callback(this);
        // send result to master
        this.socket.emit("_result", { data: result } );
        // isIdel again
        this.isIdel = true;
    }


    error(eStr){
        // send error back to master
        this.socket.emit("_error", { error: eStr } );
        // print on terminal
        console.error(new Error(eStr));
        return;
    }

}

export default Slave
