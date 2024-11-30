"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: NATO Transport Layer with AI
//
// Description:
// Enhances secure communication for NIKI nodes using NATO STANAG 4586 standards.
// Integrates AI-based anomaly detection and real-time monitoring.
//
// Features:
// - AI-driven anomaly detection for message delivery and integrity.
// - HTTPS/TLS-based secure message delivery.
// - Delivery assurance with acknowledgment and retries.
// - Digital signatures and HMAC for message integrity.
// ------------------------------------------------------------------------------

const https = require("https");
const crypto = require("crypto");
const tf = require("@tensorflow/tfjs-node"); // AI model integration
const { encryptWithQKD, decryptWithQKD } = require("../Utilities/quantumCryptographyUtils");
const { logEventToBlockchain } = require("../Utilities/blockchainLogger");
const { logTransportMetrics } = require("../AI/Utilities/monitoringTools");

// NATO-specific constants
const NATO_SERVER_URL = "https://198.51.100.5:8000";
const MAX_RETRIES = 3;
const AI_MODEL_PATH = "../Models/natoTransportAnomalyModel/model.json";

// Load the AI model
let anomalyModel;
(async () => {
    try {
        anomalyModel = await tf.loadLayersModel(`file://${AI_MODEL_PATH}`);
        console.log("AI model loaded successfully.");
    } catch (error) {
        console.error("Failed to load AI model:", error.message);
    }
})();

/**
 * Analyze transport metrics with AI for anomaly detection.
 * @param {Object} metrics - Transport metrics (e.g., retries, latency, encryption status).
 * @returns {boolean} - True if anomaly detected, false otherwise.
 */
async function analyzeTransportMetrics(metrics) {
    if (!anomalyModel) {
        console.warn("AI model not loaded. Skipping anomaly analysis.");
        return false;
    }

    try {
        const inputTensor = tf.tensor2d([
            [
                metrics.latency,
                metrics.retries,
                metrics.isEncrypted ? 1 : 0,
                metrics.signatureValid ? 1 : 0,
                metrics.messageSize,
                metrics.nodeLoad,
            ],
        ]);
        const prediction = anomalyModel.predict(inputTensor);
        const [anomalyScore] = await prediction.array();
        return anomalyScore > 0.5; // Anomaly threshold
    } catch (error) {
        console.error("Error during anomaly analysis:", error.message);
        return false;
    }
}

/**
 * Securely send a NATO message to a server with AI-based anomaly detection.
 * @param {string} nodeId - Target node identifier.
 * @param {Object} data - Data to send.
 * @param {Object} credentials - Sender's credentials (keys, tokens, etc.).
 * @returns {Promise<void>} - Completion promise.
 */
async function sendSecureNATOMessage(nodeId, data, credentials) {
    console.log(`Sending secure NATO message to node: ${nodeId} via ${NATO_SERVER_URL}...`);

    const encodedMessage = await encodeToNATOFormat(data);
    const encryptedMessage = await encryptWithQKD(encodedMessage);

    const signature = signMessage(encodedMessage, credentials.privateKey);
    const payload = {
        encryptedMessage,
        signature,
        sender: credentials.nodeId,
    };

    let attempt = 0;
    const startTime = Date.now();

    while (attempt < MAX_RETRIES) {
        try {
            await sendHTTPSRequest(NATO_SERVER_URL, payload);
            console.log("Message sent successfully.");

            const endTime = Date.now();
            const latency = endTime - startTime;

            // Log transport metrics and analyze for anomalies
            const metrics = {
                latency,
                retries: attempt,
                isEncrypted: true,
                signatureValid: true,
                messageSize: JSON.stringify(payload).length,
                nodeLoad: await getNodeLoad(), // Function to fetch current node load
            };

            const isAnomalous = await analyzeTransportMetrics(metrics);
            if (isAnomalous) {
                console.warn("Anomaly detected in transport metrics:", metrics);
                // Log the anomaly event
                await logEventToBlockchain({
                    action: "TRANSPORT_ANOMALY",
                    nodeId,
                    metrics,
                    timestamp: new Date().toISOString(),
                });
            }

            // Log transport event to blockchain
            await logEventToBlockchain({
                action: "SEND_NATO_MESSAGE",
                nodeId,
                messageHash: crypto.createHash("sha256").update(encryptedMessage).digest("hex"),
                timestamp: new Date().toISOString(),
            });

            await logTransportMetrics({ nodeId, success: true, latency });
            return;
        } catch (error) {
            attempt++;
            console.warn(`Attempt ${attempt} failed. Retrying...`, error.message);
            if (attempt === MAX_RETRIES) {
                console.error("Message delivery failed after maximum retries.");
                await logTransportMetrics({ nodeId, success: false, error: error.message });
                throw error;
            }
        }
    }
}

/**
 * Receive and process a NATO message with AI-based anomaly detection.
 * @param {string} message - Encrypted NATO message.
 * @param {string} signature - Digital signature of the message.
 * @param {string} publicKey - Public key for signature verification.
 * @returns {Promise<Object>} - Decrypted and verified message payload.
 */
async function receiveSecureNATOMessage(message, signature, publicKey) {
    console.log("Receiving NATO STANAG 4586 message...");

    const decryptedMessage = await decryptWithQKD(message);
    if (!verifySignature(decryptedMessage, signature, publicKey)) {
        throw new Error("Invalid digital signature.");
    }

    const decodedData = await decodeFromNATOFormat(decryptedMessage);

    // Log receipt event to blockchain
    await logEventToBlockchain({
        action: "RECEIVE_NATO_MESSAGE",
        messageHash: crypto.createHash("sha256").update(message).digest("hex"),
        timestamp: new Date().toISOString(),
    });

    return decodedData;
}

module.exports = {
    sendSecureNATOMessage,
    receiveSecureNATOMessage,
};