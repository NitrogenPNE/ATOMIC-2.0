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
 * Manages secure communication channels for CorporateNode2. Handles peer discovery,
 * secure WebSocket connections, and message routing with quantum-resistant encryption.
 *
 * Dependencies:
 * - WebSocket: For real-time communication.
 * - quantumCrypto.js: Provides quantum-resistant encryption utilities.
 * - nodeValidator.js: Validates incoming messages and peer connections.
 * -----------------------------------------------------------------------------
 */

const WebSocket = require("ws");
const { encryptMessage, decryptMessage } = require("../../Utils/quantumCrypto");
const { validateNode, validateMessage } = require("../../Validation/nodeValidator");
const winston = require("winston");

// Logger Setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/connectionManager.log" }),
    ],
});

// Configuration
const CONNECTION_CONFIG = {
    maxPeers: 50,
    peerDiscoveryInterval: 60000, // 60 seconds
    authorizedPeers: [
        "ws://corporate-node1.internal:6001",
        "ws://corporate-node3.internal:6003",
        "ws://hq.supernode.internal:7000",
    ],
};

// Active connections
const peers = new Map();

/**
 * Initialize the connection manager for CorporateNode2.
 */
function initializeConnectionManager() {
    logger.info("Initializing Connection Manager for CorporateNode2...");

    discoverPeers();
    setInterval(discoverPeers, CONNECTION_CONFIG.peerDiscoveryInterval);
}

/**
 * Discover and connect to peers in the network.
 */
async function discoverPeers() {
    logger.info("Discovering peers for CorporateNode2...");

    for (const peerAddress of CONNECTION_CONFIG.authorizedPeers) {
        if (!peers.has(peerAddress)) {
            connectToPeer(peerAddress);
        }
    }
}

/**
 * Establish a secure connection to a peer.
 * @param {string} peerAddress - The address of the peer to connect to.
 */
function connectToPeer(peerAddress) {
    try {
        const socket = new WebSocket(peerAddress);

        socket.on("open", () => {
            logger.info(`Connected to peer: ${peerAddress}`);
            peers.set(peerAddress, socket);
        });

        socket.on("message", (data) => handleMessage(socket, data));

        socket.on("close", () => {
            logger.warn(`Connection closed: ${peerAddress}`);
            peers.delete(peerAddress);
        });

        socket.on("error", (error) => {
            logger.error(`Error with peer ${peerAddress}: ${error.message}`);
            peers.delete(peerAddress);
        });
    } catch (error) {
        logger.error(`Failed to connect to peer ${peerAddress}: ${error.message}`);
    }
}

/**
 * Handle incoming messages from peers.
 * @param {WebSocket} socket - The WebSocket connection.
 * @param {string} data - The encrypted message data.
 */
function handleMessage(socket, data) {
    try {
        const decryptedData = decryptMessage(data);
        const message = JSON.parse(decryptedData);

        if (!validateMessage(message)) {
            throw new Error("Invalid message format.");
        }

        switch (message.type) {
            case "SHARD_REQUEST":
                handleShardRequest(socket, message.payload);
                break;
            case "BLOCK_PROPOSAL":
                handleBlockProposal(message.payload);
                break;
            case "HEARTBEAT":
                logger.info("Heartbeat received from peer.");
                break;
            default:
                logger.warn(`Unknown message type received: ${message.type}`);
        }
    } catch (error) {
        logger.error(`Failed to process incoming message: ${error.message}`);
    }
}

/**
 * Handle shard request messages.
 * @param {WebSocket} socket - The WebSocket connection.
 * @param {Object} payload - Shard request payload.
 */
function handleShardRequest(socket, payload) {
    logger.info(`Shard request received for: ${payload.shardId}`);
    // Add logic to fetch and send shard data
}

/**
 * Handle block proposal messages.
 * @param {Object} payload - Block proposal payload.
 */
function handleBlockProposal(payload) {
    logger.info(`Block proposal received with hash: ${payload.blockHash}`);
    // Add logic to process and validate the proposed block
}

/**
 * Broadcast a message to all connected peers.
 * @param {Object} message - The message to broadcast.
 */
function broadcastMessage(message) {
    const encryptedMessage = encryptMessage(JSON.stringify(message));

    peers.forEach((socket, address) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(encryptedMessage, (error) => {
                if (error) {
                    logger.error(`Failed to send message to peer ${address}: ${error.message}`);
                }
            });
        }
    });
}

module.exports = {
    initializeConnectionManager,
    broadcastMessage,
};
