import { Server } from "socket.io";


class Master {
    constructor() {
        this.io = new Server(3003);
        this.clients = [];
        this.slave = null;
        this.init();
    }

    init() {
        this.io.on("connection", (socket) => {
            // send a message to the client
            // console.log('connection: ', socket.id); // ojIckSD2jqNzOqIrAGzL
            // socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });
            // receive a message from the client
            socket.on("hello from client", (...args) => {
                console.log(args); // 1, "2", { 3: Buffer.from([4]) }
                console.log('hello from client');
            });
            // add to clients
            this.clients.push(socket);
            // get all clients  
            console.log('clients: ', this.clients.length);
        });
    }

    getSlave() {
        return this.slave;
    }

    sendToSlave(data) {
        this.slave.emit('data', data);
    }
}

/*
const io = new Server(3003);

let clients = [];
io.on("connection", (socket) => {
    // send a message to the client
    // console.log('connection: ', socket.id); // ojIckSD2jqNzOqIrAGzL
    // socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });
    // receive a message from the client
    socket.on("hello from client", (...args) => {
        console.log(args); // 1, "2", { 3: Buffer.from([4]) }
        console.log('hello from client');
    });
    // add to clients
    clients.push(socket);
    // get all clients  
    console.log('clients: ', clients.length);
});
*/

export default Master;
