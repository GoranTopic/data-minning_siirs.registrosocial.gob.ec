
class Slave {
    constructor(scker ) {
        this.name = 'Slave';
    }
    async send() {
        this.slave.emit('data', data);
    }
    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }
    async work(func) {
        // send to worker via socketio
    }   
    isIdle() {
        return true;
    }
    isBusy() {
        return false;
    }
    isDone() {
        return false;
    }
    isFailed() {
        return false;
    }
    isFinished() {
        return false;
    }
    isRunning() {
        return false;
    }
    isWaiting() {
        return false;
    }
}
