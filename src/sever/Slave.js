class Slave {
    /**
     * @param {Socket} socket - socket.io socket
     * @param {string} name - name of slave
     **/
    constructor(socket) {
        this.name = 'Slave';
        this.status = 'idle';
        this.socket = socket;
        this.return = null;
        this.init();
    }

    init() {
        // initiliaze communication with slave
        this.socket.on('_set idel', idel => {
            this.status = idel;
        });
        // error handling from socket
        this.socket.on('_error', e => {
            this.status = 'error';
            console.error('error from slave: ', e.error);
        });
        // set reciver for result
        this.socket.on('_result', result => {
            this.return = result.data;
        });  
    }

    getName() {
        return this.name;
    }

    setName(name) {
        this.name = name;
    }

    // run work on slave
    async run(work) {
        let workStr = work.toString();
        //console.log('running work: ', workStr);
        return new Promise((resolve, reject) => {
            this.status = 'busy';
            this.socket.emit('_work', workStr);
            // if result is returned
            this.socket.on('_result', result => {
                this.status = 'idle';
                resolve(result);
            });
            // if error occurs
            this.socket.on('_error', error => {
                this.status = 'idle';
                this.idel = true;
                reject(error);
            });
        });
    }

    // set parameters for slave
    async setParameers(parameters) {
        return new Promise((resolve, reject) => {
            this.socket.emit('_set parameters', work);
            this.socket.on('result', (result) => {
                resolve(result);
            });
        });
    }
    // set work to be done by slave
    async setWork(work) {
        return new Promise((resolve, reject) => {
            this.socket.emit('_set work', work);
            this.socket.on('result', (result) => {
                resolve(result);
            });
        });
    }
    // check if salve is idel
    isIdle() {
        return new Promise((resolve, reject) => {
            this.socket.emit('_set work', work);
            this.socket.on('_result', (result) => {
                resolve(result);
            });
        });
    }
}


export default Slave;
