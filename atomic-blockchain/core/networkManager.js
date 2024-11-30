"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Military-Grade Network Manager (Enhanced)
//
// Description:
// Manages secure communication, shard-specific messaging, and synchronization 
// with quantum-resistant encryption. Includes redundancy and bounce rate integration.
//
// Dependencies:
// - WebSocket: For real-time communication.
// - quantumCrypto.js: Quantum-resistant encryption utilities.
// - validationUtils.js: Validates messages, peers, and shard operations.
// - peerDiscovery.js: Handles dynamic peer discovery.
//
// ------------------------------------------------------------------------------

const WebSocket = require("ws");
const winston = require("winston");
const { encryptMessage, decryptMessage } = require("../utils/quantumCrypto");
const { validateMessage, validatePeer, validateShardMetadata } = require("../utils/validationUtils");
const { discoverPeers } = require("./peerDiscovery");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "network-error.log", level: "error" }),
        new winston.transports.File({ filename: "network.log" }),
    ],
});

// **Network Configuration**
const NETWORK_CONFIG = {
    port: process.env.NETWORK_PORT || 6000,
    maxPeers: 50,
    heartbeatInterval: 30000,
    authorizedPeers: ["ws://hq.supernode.local:7000", "ws://corp.node1.local:7001"],
};

// **Peer Management**
const peers = new Map(); // Stores active peers
let hqSupernode = null; // HQ Supernode connection

/**
 * Start the network manager.
 */
function startNetworkManager() {
    const server = new WebSocket.Server({ port: NETWORK_CONFIG.port });

    server.on("connection", (socket, req) => {
        const peerAddress = req.socket.remoteAddress;

        if (!validatePeer(peerAddress, NETWORK_CONFIG.authorizedPeers)) {
            logger.warn(`Unauthorized peer connection attempt: ${peerAddress}`);
            socket.close();
            return;
        }

        logger.info(`New peer connected: ${peerAddress}`);

        socket.on("message", (data) => handleMessage(socket, data));
        socket.on("close", () => handleDisconnect(peerAddress));
        socket.on("error", (error) => logger.error(`Error with peer ${peerAddress}:`, error));

        peers.set(peerAddress, socket);
    });

    server.on("listening", () => {
        logger.info(`Network Manager is running on port ${NETWORK_CONFIG.port}`);
    });

    discoverAndConnectPeers();
    startHeartbeat();
    initializeHQSupernodeConnection();
}

/**
 * Discover and connect to peers dynamically.
 */
async function discoverAndConnectPeers() {
    logger.info("Discovering peers...");
    const discoveredPeers = await discoverPeers();

    discoveredPeers.forEach((peer) => {
        if (!peers.has(peer) && validatePeer(peer, NETWORK_CONFIG.authorizedPeers)) {
            connectToPeer(peer);
        }
    });
}

/**
 * Connect to a new peer.
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
        socket.on("close", () => handleDisconnect(peerAddress));
        socket.on("error", (error) => logger.error(`Error with peer ${peerAddress}:`, error));
    } catch (error) {
        logger.error(`Failed to connect to peer ${peerAddress}:`, error);
    }
}

/**
 * Handle incoming messages from peers.
 * @param {WebSocket} socket - WebSocket connection.
 * @param {string} data - Received message data.
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

            case "SHARD_BOUNCE":
                handleShardBounce(socket, message.payload);
                break;

            case "SYNC_REQUEST":
                synchronizeWithHQ();
                break;

            case "HEARTBEAT":
                logger.info("Heartbeat received from peer.");
                break;

            default:
                logger.warn("Unknown message type received:", message.type);
        }
    } catch (error) {
        logger.error("Failed to process incoming message:", error);
    }
}

/**
 * Handle shard request messages.
 * @param {WebSocket} socket - WebSocket connection.
 * @param {Object} payload - Shard request payload with atomic metadata.
 */
function handleShardRequest(socket, payload) {
    logger.info(`Received shard request for: ${payload.shardId}`);
    // Logic to fetch shard with protons, neutrons, and electrons
}

/**
 * Handle shard bounce messages.
 * @param {WebSocket} socket - WebSocket connection.
 * @param {Object} payload - Shard bounce payload with redundancy and bounce rates.
 */
function handleShardBounce(socket, payload) {
    logger.info(`Shard bounce received for: ${payload.shardId}`);
    // Logic to validate and process bounced shards
}

/**
 * Handle peer disconnection.
 * @param {string} peerAddress - Address of the disconnected peer.
 */
function handleDisconnect(peerAddress) {
    logger.warn(`Peer disconnected: ${peerAddress}`);
    peers.delete(peerAddress);
}

/**
 * Start periodic heartbeat checks for peer health.
 */
function startHeartbeat() {
    setInterval(() => {
        peers.forEach((socket, address) => {
            if (socket.readyState !== WebSocket.OPEN) {
                logger.warn(`Removing unresponsive peer: ${address}`);
                peers.delete(address);
            }
        });
    }, NETWORK_CONFIG.heartbeatInterval);
}

/**
 * Synchronize corporate nodes with the HQ supernode.
 */
function synchronizeWithHQ() {
    if (!hqSupernode || hqSupernode.readyState !== WebSocket.OPEN) {
        logger.warn("HQ supernode connection is not available.");
        return;
    }

    const syncMessage = encryptMessage(JSON.stringify({ type: "SYNC_REQUEST", data: "Synchronization data" }));
    hqSupernode.send(syncMessage, (error) => {
        if (error) {
            logger.error("Failed to synchronize with HQ supernode:", error);
        }
    });
}

/**
 * Initialize connection to the HQ supernode.
 */
function initializeHQSupernodeConnection() {
    const hqAddress = NETWORK_CONFIG.authorizedPeers[0];

    hqSupernode = new WebSocket(hqAddress);

    hqSupernode.on("open", () => {
        logger.info("Connected to HQ supernode:", hqAddress);
    });

    hqSupernode.on("message", (data) => {
        const decryptedData = decryptMessage(data);
        logger.info("Received message from HQ supernode:", decryptedData);
    });

    hqSupernode.on("close", () => {
        logger.warn("HQ supernode connection closed.");
    });

    hqSupernode.on("error", (error) => {
        logger.error("Error with HQ supernode connection:", error);
    });
}

module.exports = {
    startNetworkManager,
    connectToPeer,
};