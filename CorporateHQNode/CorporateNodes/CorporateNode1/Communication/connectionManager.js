"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Connection Manager
 *
 * Description:
 * Manages secure communication between CorporateNode1 and other nodes,
 * ensuring encrypted, authenticated, and monitored connections. This includes
 * initiating and maintaining WebSocket connections, managing peer trust,
 * and monitoring for anomalies or unauthorized access.
 *
 * Author: Shawn Blackmore
 * ------------------------------------------------------------------------------
 */

const WebSocket = require("ws");
const winston = require("winston");
const crypto = require("crypto");
const { validatePeer, encryptMessage, decryptMessage } = require("../../utils/communicationUtils");
const { logEvent } = require("../../utils/loggingUtils");
const { CONNECTION_SETTINGS, TRUSTED_PEERS } = require("../../config/communicationConfig.json");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "./logs/connectionManager.log" })
    ]
});

// **Connection State**
const activeConnections = new Map();

/**
 * Establishes a secure connection to a peer.
 * @param {string} peerAddress - The WebSocket address of the peer.
 * @returns {Promise<WebSocket>} - The established WebSocket connection.
 */
async function connectToPeer(peerAddress) {
    logger.info(`Attempting to connect to peer: ${peerAddress}`);
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(peerAddress);

        socket.on("open", () => {
            logger.info(`Connected to peer: ${peerAddress}`);
            activeConnections.set(peerAddress, socket);
            resolve(socket);
        });

        socket.on("message", (data) => handleIncomingMessage(peerAddress, data));

        socket.on("close", () => {
            logger.warn(`Connection closed with peer: ${peerAddress}`);
            activeConnections.delete(peerAddress);
        });

        socket.on("error", (error) => {
            logger.error(`Error with peer ${peerAddress}: ${error.message}`);
            reject(error);
        });
    });
}

/**
 * Handles incoming messages from a peer.
 * @param {string} peerAddress - The peer's address.
 * @param {string} data - The received data.
 */
function handleIncomingMessage(peerAddress, data) {
    try {
        const decryptedData = decryptMessage(data);
        const message = JSON.parse(decryptedData);

        logger.info(`Message received from ${peerAddress}:`, message);

        // Validate message integrity and handle actions
        if (!validatePeer(peerAddress, TRUSTED_PEERS)) {
            throw new Error(`Untrusted peer attempted communication: ${peerAddress}`);
        }

        switch (message.type) {
            case "SHARD_REQUEST":
                logger.info(`Processing shard request from ${peerAddress}`);
                processShardRequest(peerAddress, message.payload);
                break;

            case "SYNC_DATA":
                logger.info(`Received sync data from ${peerAddress}`);
                handleSyncData(message.payload);
                break;

            case "HEARTBEAT":
                logger.info(`Heartbeat received from ${peerAddress}`);
                break;

            default:
                logger.warn(`Unknown message type received from ${peerAddress}: ${message.type}`);
        }
    } catch (error) {
        logger.error(`Failed to process message from ${peerAddress}: ${error.message}`);
    }
}

/**
 * Sends a message to a connected peer.
 * @param {string} peerAddress - The peer's address.
 * @param {Object} message - The message payload.
 */
function sendMessage(peerAddress, message) {
    try {
        const socket = activeConnections.get(peerAddress);
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            throw new Error(`Connection to peer ${peerAddress} is not open.`);
        }

        const encryptedMessage = encryptMessage(JSON.stringify(message));
        socket.send(encryptedMessage);
        logger.info(`Message sent to ${peerAddress}:`, message);
    } catch (error) {
        logger.error(`Failed to send message to ${peerAddress}: ${error.message}`);
    }
}

/**
 * Handles shard requests from peers.
 * @param {string} peerAddress - The peer's address.
 * @param {Object} payload - The shard request payload.
 */
function processShardRequest(peerAddress, payload) {
    logger.info(`Shard request received from ${peerAddress}:`, payload);
    // Implement logic for fetching and responding with shard data
}

/**
 * Handles sync data from peers.
 * @param {Object} payload - The sync data payload.
 */
function handleSyncData(payload) {
    logger.info(`Processing sync data:`, payload);
    // Implement logic for synchronizing data
}

/**
 * Initiates a heartbeat check to maintain connection health.
 */
function startHeartbeat() {
    setInterval(() => {
        activeConnections.forEach((socket, peerAddress) => {
            if (socket.readyState === WebSocket.OPEN) {
                sendMessage(peerAddress, { type: "HEARTBEAT" });
            } else {
                logger.warn(`Peer ${peerAddress} is unresponsive. Closing connection.`);
                socket.close();
            }
        });
    }, CONNECTION_SETTINGS.heartbeatIntervalMs);
}

/**
 * Disconnects a peer and removes them from active connections.
 * @param {string} peerAddress - The peer's address.
 */
function disconnectPeer(peerAddress) {
    const socket = activeConnections.get(peerAddress);
    if (socket) {
        socket.close();
        logger.info(`Disconnected from peer: ${peerAddress}`);
        activeConnections.delete(peerAddress);
    } else {
        logger.warn(`Attempted to disconnect non-existent peer: ${peerAddress}`);
    }
}

module.exports = {
    connectToPeer,
    sendMessage,
    startHeartbeat,
    disconnectPeer
};

// Automatically initiate the heartbeat process
startHeartbeat();
