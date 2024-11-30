/**
 * BranchNode2 Connection Manager
 * Handles communication initialization, connection monitoring, and network updates for BranchNode2.
 */

const net = require("net");
const EventEmitter = require("events");

class ConnectionManager extends EventEmitter {
    constructor() {
        super();
        this.connections = [];
        this.nodeName = "BranchNode2";
        this.port = 8082; // Default communication port for BranchNode2
    }

    /**
     * Initializes the connection manager and starts the server.
     */
    initialize() {
        const server = net.createServer((socket) => {
            console.log(`[${this.nodeName}] New connection established from ${socket.remoteAddress}:${socket.remotePort}`);
            this.connections.push(socket);

            // Handle incoming data
            socket.on("data", (data) => {
                console.log(`[${this.nodeName}] Received data: ${data}`);
                this.emit("dataReceived", data.toString());
            });

            // Handle connection closure
            socket.on("close", () => {
                console.log(`[${this.nodeName}] Connection closed: ${socket.remoteAddress}:${socket.remotePort}`);
                this.connections = this.connections.filter((conn) => conn !== socket);
            });

            // Handle errors
            socket.on("error", (err) => {
                console.error(`[${this.nodeName}] Connection error: ${err.message}`);
            });
        });

        // Start the server
        server.listen(this.port, () => {
            console.log(`[${this.nodeName}] Connection Manager is listening on port ${this.port}`);
        });

        server.on("error", (err) => {
            console.error(`[${this.nodeName}] Server error: ${err.message}`);
        });
    }

    /**
     * Broadcast a message to all active connections.
     * @param {string} message - Message to broadcast.
     */
    broadcast(message) {
        this.connections.forEach((socket) => {
            socket.write(message);
        });
        console.log(`[${this.nodeName}] Broadcasted message: ${message}`);
    }
}

// Instantiate and initialize the Connection Manager
const connectionManager = new ConnectionManager();
connectionManager.initialize();

module.exports = connectionManager;