"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Connection Manager
//
// Description:
// Manages and validates node connections to the HQNode, ensuring secure 
// communication and subscription handling for Corporate and National Defense Nodes.
// Tracks active connections, validates node identities, and handles disconnections.
//
// Dependencies:
// - ws: For WebSocket-based communication.
// - crypto: For secure token validation.
// - blockchainLogger: Logs connection events for auditing.
// - fs-extra: Ensures connection configuration and logs are properly handled.
//
// Usage:
// const { initializeConnectionManager } = require('./connectionManager');
// initializeConnectionManager(8080);
// ------------------------------------------------------------------------------

const WebSocket = require("ws");
const crypto = require("crypto");
const { logConnectionEvent } = require("./blockchainLogger");
const fs = require("fs-extra");
const path = require("path");

// **Configuration**
const CONNECTION_CONFIG_PATH = path.resolve(__dirname, "../Config/connectionConfig.json");
const ACTIVE_CONNECTIONS = new Map(); // Tracks active node connections

/**
 * Initializes the WebSocket server for managing connections.
 * @param {number} port - Port on which the WebSocket server listens.
 */
function initializeConnectionManager(port) {
    const server = new WebSocket.Server({ port });

    console.log(`Connection Manager started on port ${port}`);
    logConnectionEvent("ConnectionManagerStarted", { port });

    server.on("connection", (socket, req) => {
        const clientAddress = req.socket.remoteAddress;
        console.log(`New connection attempt from ${clientAddress}`);
        logConnectionEvent("ConnectionAttempt", { clientAddress });

        // Handle new connection
        socket.on("message", (message) => handleConnectionMessage(socket, message));
        socket.on("close", () => handleDisconnection(clientAddress));
        socket.on("error", (error) => handleConnectionError(clientAddress, error));

        // Track connection
        ACTIVE_CONNECTIONS.set(clientAddress, socket);
    });

    server.on("error", (error) => {
        console.error("Connection Manager encountered an error:", error.message);
        logConnectionEvent("ConnectionManagerError", { error: error.message });
    });
}

/**
 * Handles incoming messages from nodes.
 * @param {WebSocket} socket - The WebSocket connection.
 * @param {string} message - The received message.
 */
function handleConnectionMessage(socket, message) {
    try {
        const data = JSON.parse(message);
        const { type, payload } = data;

        if (type === "subscribe") {
            validateNodeSubscription(socket, payload);
        } else {
            console.warn(`Unknown message type: ${type}`);
        }
    } catch (error) {
        console.error("Error processing connection message:", error.message);
    }
}

/**
 * Validates a node's subscription request.
 * @param {WebSocket} socket - The WebSocket connection.
 * @param {Object} payload - Subscription payload containing nodeId and token.
 */
async function validateNodeSubscription(socket, payload) {
    const { nodeId, token } = payload;

    if (!nodeId || !token) {
        console.error("Invalid subscription payload received.");
        socket.send(JSON.stringify({ error: "Invalid subscription payload." }));
        return;
    }

    try {
        const isValid = await validateToken(nodeId, token);
        if (isValid) {
            console.log(`Node ${nodeId} successfully subscribed.`);
            logConnectionEvent("NodeSubscribed", { nodeId });
            socket.send(JSON.stringify({ success: true, message: "Subscription successful." }));
        } else {
            console.warn(`Node ${nodeId} failed subscription validation.`);
            socket.send(JSON.stringify({ error: "Subscription validation failed." }));
        }
    } catch (error) {
        console.error(`Error during subscription validation for node ${nodeId}:`, error.message);
        socket.send(JSON.stringify({ error: "Internal error during validation." }));
    }
}

/**
 * Validates a node's token.
 * @param {string} nodeId - Node ID.
 * @param {string} token - Node token.
 * @returns {Promise<boolean>} - True if token is valid, false otherwise.
 */
async function validateToken(nodeId, token) {
    try {
        const config = await fs.readJson(CONNECTION_CONFIG_PATH);
        const expectedToken = config.tokens[nodeId];
        const hash = crypto.createHash("sha256").update(token).digest("hex");

        return hash === expectedToken;
    } catch (error) {
        console.error("Failed to validate token:", error.message);
        return false;
    }
}

/**
 * Handles node disconnection.
 * @param {string} clientAddress - Address of the disconnected node.
 */
function handleDisconnection(clientAddress) {
    console.log(`Node disconnected: ${clientAddress}`);
    ACTIVE_CONNECTIONS.delete(clientAddress);
    logConnectionEvent("NodeDisconnected", { clientAddress });
}

/**
 * Handles connection errors.
 * @param {string} clientAddress - Address of the node.
 * @param {Error} error - Connection error details.
 */
function handleConnectionError(clientAddress, error) {
    console.error(`Error with connection from ${clientAddress}:`, error.message);
    logConnectionEvent("ConnectionError", { clientAddress, error: error.message });
}

module.exports = {
    initializeConnectionManager,
};