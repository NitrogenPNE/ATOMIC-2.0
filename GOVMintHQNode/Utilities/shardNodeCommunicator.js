"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Shard Node Communicator
 *
 * Description:
 * Handles secure communication with nodes for shard-related operations, including
 * allocation, revocation, and metadata updates. Ensures node responses are validated
 * and operations are logged for compliance.
 *
 * Dependencies:
 * - axios: For HTTP-based communication with nodes.
 * - crypto: For securing and validating messages.
 * - logger.js: For logging node communication operations.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const axios = require("axios");
const crypto = require("crypto");
const { logInfo, logError } = require("../Logs/logger");

// **Constants**
const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || "default-node-secret";
const NODE_TIMEOUT_MS = 5000; // Timeout for node communication

/**
 * Sends a secure message to a node.
 * @param {string} nodeAddress - The address of the target node.
 * @param {Object} message - The message payload to send.
 * @returns {Promise<Object>} - The node's response.
 */
async function communicateWithNode(nodeAddress, message) {
    try {
        console.log(`Communicating with Node: ${nodeAddress}...`);

        // Step 1: Sign the message for authenticity
        const timestamp = new Date().toISOString();
        const signature = generateMessageSignature(message, timestamp);

        const payload = {
            message,
            timestamp,
            signature,
        };

        // Step 2: Send the message to the node
        const response = await axios.post(
            `${nodeAddress}/shardOperations`,
            payload,
            { timeout: NODE_TIMEOUT_MS }
        );

        console.log(`Response from Node ${nodeAddress}:`, response.data);

        // Step 3: Validate the response signature
        if (!validateNodeResponse(response.data)) {
            throw new Error(`Invalid response signature from Node: ${nodeAddress}`);
        }

        logInfo(`Successfully communicated with Node: ${nodeAddress}`);
        return response.data;
    } catch (error) {
        logError(`Error communicating with Node ${nodeAddress}: ${error.message}`);
        throw error;
    }
}

/**
 * Generates a signature for the message payload.
 * @param {Object} message - The message payload to sign.
 * @param {string} timestamp - The timestamp to include in the signature.
 * @returns {string} - The generated signature.
 */
function generateMessageSignature(message, timestamp) {
    const data = JSON.stringify({ message, timestamp });
    return crypto.createHmac("sha256", NODE_SECRET_KEY).update(data).digest("hex");
}

/**
 * Validates a node's response by checking its signature.
 * @param {Object} response - The node's response.
 * @returns {boolean} - True if the response signature is valid, otherwise false.
 */
function validateNodeResponse(response) {
    const { message, timestamp, signature } = response;

    if (!message || !timestamp || !signature) {
        return false;
    }

    const expectedSignature = generateMessageSignature(message, timestamp);
    return expectedSignature === signature;
}

module.exports = {
    communicateWithNode,
};
