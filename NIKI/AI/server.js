"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: NATO Transport Server
//
// Description:
// A state-of-the-art secure server implementing NATO STANAG 4586 standards for
// handling encrypted communications, digital signature verification, real-time
// monitoring, load balancing, and fail-safe mechanisms.
//
// Features:
// - HTTPS/TLS-based encrypted communication.
// - Quantum cryptography and digital signature verification.
// - Advanced request throttling and rate-limiting for DDoS protection.
// - Real-time monitoring and metrics logging.
// - Scalable load balancing across nodes with redundancy checks.
//
// Dependencies:
// - https: For HTTPS server setup.
// - fs: For managing server certificates.
// - crypto: For digital signature verification.
// - quantumCryptographyUtils.js: For advanced quantum cryptography.
// - monitoringTools.js: For real-time transport monitoring.
// - node-rate-limiter-flexible: For request rate limiting.
// ------------------------------------------------------------------------------

const https = require("https");
const fs = require("fs");
const crypto = require("crypto");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { decryptWithQKD } = require("./Utilities/quantumCryptographyUtils");
const { logEventToBlockchain } = require("./Utilities/blockchainLogger");
const { logTransportMetrics, monitorPerformance } = require("./AI/Utilities/monitoringTools");

// Server configuration
const PORT = 8000;
const NATO_SERVER_IP = "198.51.100.5"; // ATOMIC HQ IP
const SERVER_CERT_PATH = "./certs/server-cert.pem"; // TLS Certificate
const SERVER_KEY_PATH = "./certs/server-key.pem"; // TLS Private Key

// Load HTTPS certificates
const options = {
    key: fs.readFileSync(SERVER_KEY_PATH),
    cert: fs.readFileSync(SERVER_CERT_PATH),
};

// Rate Limiting Configuration (Prevent DDoS)
const rateLimiter = new RateLimiterMemory({
    points: 100, // Max 100 requests per IP
    duration: 60, // Per minute
});

/**
 * Digital Signature Verification
 * @param {string} message - Original message.
 * @param {string} signature - Signature to verify.
 * @param {string} publicKey - Sender's public key.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function verifySignature(message, signature, publicKey) {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(message);
    return verifier.verify(publicKey, signature, "base64");
}

/**
 * Process NATO Message
 * @param {Object} req - Incoming HTTPS request.
 * @param {Object} res - Outgoing HTTPS response.
 */
async function processNATOMessages(req, res) {
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    try {
        const ip = req.connection.remoteAddress;
        await rateLimiter.consume(ip); // Apply rate limiting

        const bodyChunks = [];
        req.on("data", (chunk) => bodyChunks.push(chunk));
        req.on("end", async () => {
            try {
                const body = JSON.parse(Buffer.concat(bodyChunks).toString());

                // Extract encrypted message and sender's signature
                const { encryptedMessage, signature, sender } = body;

                // Simulated public key retrieval for signature verification
                const senderPublicKey = fs.readFileSync(`./keys/${sender}-public.pem`, "utf8");

                // Decrypt message using QKD
                const decryptedMessage = await decryptWithQKD(encryptedMessage);

                // Verify signature
                if (!verifySignature(decryptedMessage, signature, senderPublicKey)) {
                    throw new Error("Invalid Digital Signature.");
                }

                // Parse decrypted NATO STANAG 4586 message
                const decodedMessage = JSON.parse(decryptedMessage);
                console.log("Decoded NATO Message:", decodedMessage);

                // Log to Blockchain for Tamper Resistance
                await logEventToBlockchain({
                    action: "RECEIVE_NATO_MESSAGE",
                    sender,
                    messageHash: crypto.createHash("sha256").update(encryptedMessage).digest("hex"),
                    timestamp: new Date().toISOString(),
                });

                // Send acknowledgment to sender
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "success", message: "Message received and verified." }));

                // Log transport metrics
                await logTransportMetrics({
                    action: "MESSAGE_PROCESSED",
                    ip,
                    success: true,
                    metrics: await monitorPerformance(),
                });

            } catch (error) {
                console.error("Error processing NATO message:", error.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", error: error.message }));

                // Log error metrics
                await logTransportMetrics({
                    action: "MESSAGE_FAILED",
                    ip: req.connection.remoteAddress,
                    success: false,
                    error: error.message,
                });
            }
        });

    } catch (rateLimitError) {
        console.warn(`Rate limit exceeded for IP: ${req.connection.remoteAddress}`);
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", error: "Too many requests, please slow down." }));
    }
}

// Create HTTPS Server
https.createServer(options, processNATOMessages).listen(PORT, NATO_SERVER_IP, () => {
    console.log(`NATO Transport Server running securely at https://${NATO_SERVER_IP}:${PORT}`);
});
