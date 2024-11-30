"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -----------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Connection Manager
 *
 * Description:
 * Manages secure WebSocket connections for CorporateNode3, including message
 * encryption, peer authentication, and heartbeats. Ensures reliable communication
 * across the ATOMIC blockchain network.
 *
 * Author: Shawn Blackmore
 * -----------------------------------------------------------------------------
 */

const WebSocket = require("ws");
const { encryptMessage, decryptMessage } = require("../../Utilities/encryptionUtils");
const { validatePeer } = require("../../Utilities/peerValidationUtils");
const logger = require("../../Utilities/logger");

// Configuration
const NODE_CONFIG = {
    port: 6013,
    maxConnections: 50,
    heartbeatIntervalMs: 30000,
    authorizedPeers: [
        "ws://corporate-node1.local:6011",
        "ws://corporate-node2.local:6012",
        "ws://hq-node.local:7000"
    ]
};

// Active WebSocket connections
const connections = new Map();

/**
 * Initialize the WebSocket server for this Corporate Node.
 */
function initializeConnectionManager() {
    const server = new WebSocket.Server({ port: NODE_CONFIG.port });

    server.on("connection", (socket, req) => {
        const peerAddress = req.socket.remoteAddress;

        if (!validatePeer(peerAddress, NODE_CONFIG.authorizedPeers)) {
            logger.warn(`Unauthorized connection attempt from ${peerAddress}`);
            socket.close();
            return;
        }

        logger.info(`New connection established from ${peerAddress}`);
        connections.set(peerAddress, socket);

        socket.on("message", (data) => handleIncomingMessage(socket, data));
        socket.on("close", () => handleDisconnect(peerAddress));
        socket.on("error", (error) => logger.error(`Connection error with ${peerAddress}: ${error.message}`));
    });

    server.on("listening", () => {
        logger.info(`Connection Manager is listening on port ${NODE_CONFIG.port}`);
    });

    startHeartbeat();
}

/**
 * Handle incoming messages.
 * @param {WebSocket} socket - WebSocket connection.
 * @param {string} data - Received data.
 */
function handleIncomingMessage(socket, data) {
    try {
        const decryptedData = decryptMessage(data);
        const message = JSON.parse(decryptedData);

        switch (message.type) {
            case "SHARD_SYNC":
                logger.info("Shard synchronization message received.");
                // Handle shard sync logic here
                break;

            case "BLOCK_UPDATE":
                logger.info("Block update received.");
                // Handle block update logic here
                break;

            default:
                logger.warn(`Unknown message type: ${message.type}`);
        }
    } catch (error) {
        logger.error(`Failed to process incoming message: ${error.message}`);
    }
}

/**
 * Handle disconnection of a peer.
 * @param {string} peerAddress - The address of the disconnected peer.
 */
function handleDisconnect(peerAddress) {
    logger.warn(`Peer disconnected: ${peerAddress}`);
    connections.delete(peerAddress);
}

/**
 * Send a message to all connected peers.
 * @param {Object} message - Message object to send.
 */
function broadcastMessage(message) {
    const encryptedMessage = encryptMessage(JSON.stringify(message));

    connections.forEach((socket, peerAddress) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(encryptedMessage);
        } else {
            logger.warn(`Connection to ${peerAddress} is not open. Removing from active connections.`);
            connections.delete(peerAddress);
        }
    });
}

/**
 * Start periodic heartbeat checks to ensure connections are alive.
 */
function startHeartbeat() {
    setInterval(() => {
        connections.forEach((socket, peerAddress) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(encryptMessage(JSON.stringify({ type: "HEARTBEAT" })));
            } else {
                logger.warn(`Peer ${peerAddress} failed heartbeat. Removing connection.`);
                connections.delete(peerAddress);
            }
        });
    }, NODE_CONFIG.heartbeatIntervalMs);
}

module.exports = {
    initializeConnectionManager,
    broadcastMessage
};

// Automatically initialize on load
initializeConnectionManager();
