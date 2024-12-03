"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Message Routing Service
// ------------------------------------------------------------------------------

"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Message Routing Service
// ------------------------------------------------------------------------------

// Dependencies
const crypto = require("crypto");
const { fetchTokenDetails } = require("../../../Pricing/Config/tokenMetadata"); // Correct path to token metadata
const { validateTokenSignature } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");
const fs = require("fs-extra");
const path = require("path");

// Configuration
const ROUTING_RULES_PATH = path.resolve(__dirname, "../Config/routingRules.json");

/**
 * Load Routing Rules from configuration.
 * @returns {Object} - The routing rules configuration.
 */
async function loadRoutingRules() {
    try {
        const routingRules = await fs.readJson(ROUTING_RULES_PATH);
        logInfo("Routing rules loaded successfully.");
        return routingRules;
    } catch (error) {
        logError("Failed to load routing rules.", { error: error.message });
        throw error;
    }
}

/**
 * Route a message based on token metadata.
 * @param {Object} tokenDetails - Details of the token used for routing.
 * @param {string} message - The message payload.
 * @returns {Promise<boolean>} - True if routing is successful, otherwise false.
 */
async function routeMessage(tokenDetails, message) {
    try {
        logInfo("Routing message...", { tokenId: tokenDetails.tokenId });

        // Validate the token authenticity and signature
        const isValidToken = await validateTokenSignature(
            tokenDetails.tokenId,
            tokenDetails.encryptedToken
        );
        if (!isValidToken) {
            logError("Token validation failed. Message routing aborted.", { tokenId: tokenDetails.tokenId });
            return false;
        }

        // Fetch token metadata from the registry
        const tokenMetadata = await fetchTokenDetails(tokenDetails.tokenId);
        if (!tokenMetadata) {
            logError("Token metadata not found in registry.", { tokenId: tokenDetails.tokenId });
            return false;
        }

        // Load routing rules
        const routingRules = await loadRoutingRules();
        const destinationNode = routingRules[tokenMetadata.tokenClass];

        if (!destinationNode) {
            logError("No routing destination found for token class.", { tokenClass: tokenMetadata.tokenClass });
            return false;
        }

        logInfo("Routing message to destination node.", { destinationNode });

        // Encrypt the message and simulate sending to the destination node
        const encryptedMessage = encryptMessage(message, destinationNode.encryptionKey);
        const isMessageSent = await sendMessageToNode(destinationNode.endpoint, encryptedMessage);

        if (isMessageSent) {
            logInfo("Message routed successfully.", { destinationNode });
            return true;
        } else {
            logError("Failed to send message to destination node.", { destinationNode });
            return false;
        }
    } catch (error) {
        logError("Error occurred during message routing.", { error: error.message });
        return false;
    }
}

/**
 * Encrypt a message for secure transmission.
 * @param {string} message - The message payload.
 * @param {string} encryptionKey - The encryption key.
 * @returns {Object} - Encrypted payload with metadata.
 */
function encryptMessage(message, encryptionKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(encryptionKey, "base64"), iv);

    const encryptedMessage = Buffer.concat([
        cipher.update(message, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
        encryptedMessage: encryptedMessage.toString("hex"),
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

/**
 * Simulate sending an encrypted message to a destination node.
 * @param {string} endpoint - The destination node endpoint.
 * @param {Object} encryptedPayload - The encrypted message payload.
 * @returns {Promise<boolean>} - True if the message is sent successfully, otherwise false.
 */
async function sendMessageToNode(endpoint, encryptedPayload) {
    try {
        // Simulating sending message to the endpoint (replace with actual implementation)
        logInfo("Simulated message sent to endpoint.", { endpoint, encryptedPayload });
        return true;
    } catch (error) {
        logError("Failed to send message to node.", { endpoint, error: error.message });
        return false;
    }
}

module.exports = {
    routeMessage,
};