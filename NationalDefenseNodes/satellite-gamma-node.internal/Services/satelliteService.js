"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Gamma Node Service
// ------------------------------------------------------------------------------

// Dependencies
const crypto = require("crypto");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { logActionToBlockchain } = require("./blockchainIntegration");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");

// Configuration
const SERVICE_CONFIG = {
    encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("base64"),
    defaultPort: 8080,
    retryPolicy: {
        maxRetries: 3,
        retryIntervalMs: 5000,
    },
};

/**
 * Process incoming communication requests.
 * @param {Object} requestData - The request payload.
 * @returns {Promise<boolean>} - True if the request is processed successfully.
 */
async function processCommunicationRequest(requestData) {
    try {
        logInfo("Processing communication request...", { requestId: requestData.id });

        // Validate the token
        const { tokenId, encryptedToken } = requestData;
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            logError("Token validation failed for communication request.", { tokenId });
            return false;
        }

        // Decrypt the incoming message
        const decryptionKey = Buffer.from(SERVICE_CONFIG.encryptionKey, "base64");
        const decryptedMessage = decryptWithQuantum(requestData.encryptedMessage, decryptionKey);
        logInfo("Message decrypted successfully.", { requestId: requestData.id });

        // Log the action to the blockchain
        const blockchainLogResult = await logActionToBlockchain({
            actionType: "CommunicationReceived",
            satelliteId: requestData.satelliteId,
            messageHash: crypto.createHash("sha256").update(decryptedMessage).digest("hex"),
            tokenId,
        });

        if (!blockchainLogResult) {
            logError("Failed to log communication action to blockchain.", { requestId: requestData.id });
            return false;
        }

        logInfo("Communication request processed successfully.", { requestId: requestData.id });
        return true;
    } catch (error) {
        logError("Error processing communication request.", { error: error.message });
        return false;
    }
}

/**
 * Send an encrypted communication message.
 * @param {Object} messageDetails - Message payload details.
 * @returns {Promise<boolean>} - True if the message is sent successfully.
 */
async function sendCommunicationMessage(messageDetails) {
    try {
        logInfo("Sending communication message...", { messageId: messageDetails.id });

        // Encrypt the message
        const encryptionKey = Buffer.from(SERVICE_CONFIG.encryptionKey, "base64");
        const encryptedMessage = encryptWithQuantum(Buffer.from(messageDetails.message, "utf-8"), encryptionKey);
        logInfo("Message encrypted successfully.", { messageId: messageDetails.id });

        // Log the action to the blockchain
        const blockchainLogResult = await logActionToBlockchain({
            actionType: "CommunicationSent",
            satelliteId: messageDetails.satelliteId,
            messageHash: crypto.createHash("sha256").update(messageDetails.message).digest("hex"),
            tokenId: messageDetails.tokenId,
        });

        if (!blockchainLogResult) {
            logError("Failed to log communication action to blockchain.", { messageId: messageDetails.id });
            return false;
        }

        logInfo("Communication message sent successfully.", { messageId: messageDetails.id });
        return true;
    } catch (error) {
        logError("Error sending communication message.", { error: error.message });
        return false;
    }
}

module.exports = {
    processCommunicationRequest,
    sendCommunicationMessage,
};
