/**
 * BranchNode1 Connection Manager
 * Responsible for managing network connections within the Branch Node.
 */

const net = require("net");

const connectionManager = {
    connections: [],

    /**
     * Establish a new connection to a specified node.
     * @param {string} host - The target node's hostname or IP address.
     * @param {number} port - The target node's port number.
     */
    establishConnection: function (host, port) {
        const client = new net.Socket();
        client.connect(port, host, () => {
            console.log(`Connected to ${host}:${port}`);
            this.connections.push(client);
        });

        client.on("data", (data) => {
            console.log(`Received data from ${host}:${port}: ${data}`);
        });

        client.on("error", (err) => {
            console.error(`Connection error with ${host}:${port}:`, err.message);
        });

        client.on("close", () => {
            console.log(`Connection to ${host}:${port} closed.`);
            this.connections = this.connections.filter(conn => conn !== client);
        });
    },

    /**
     * Broadcast a message to all active connections.
     * @param {string} message - The message to be broadcast.
     */
    broadcastMessage: function (message) {
        this.connections.forEach((client) => {
            client.write(message);
        });
        console.log("Broadcast message sent to all connections.");
    },

    /**
     * Close all active connections.
     */
    closeAllConnections: function () {
        this.connections.forEach((client) => {
            client.end();
        });
        console.log("All connections closed.");
    }
};

module.exports = connectionManager;

// Example usage (Uncomment to test in a standalone script):
// connectionManager.establishConnection("127.0.0.1", 8080);
// connectionManager.broadcastMessage("Hello, network!");
// setTimeout(() => connectionManager.closeAllConnections(), 10000);