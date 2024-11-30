"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Blockchain Logger
//
// Description:
// Provides utilities for logging events immutably to a blockchain or distributed 
// ledger. This ensures traceability, tamper resistance, and transparency in NIKI's operations.
//
// Dependencies:
// - crypto: For secure hashing of events.
// - https: For communicating with the blockchain node or ledger API.
// - dotenv: For managing environment variables securely.
//
// Features:
// - Hash-based event integrity.
// - Blockchain or DLT integration for tamper-proof logs.
// - Retry mechanism for resilient logging.
//
// ------------------------------------------------------------------------------

const https = require("https");
const crypto = require("crypto");
require("dotenv").config(); // Load environment variables

// **Blockchain Node Configuration**
const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "https://blockchain-node.example.com";
const API_KEY = process.env.BLOCKCHAIN_API_KEY || "your-api-key"; // Ensure this is securely stored
const MAX_RETRIES = 3;

/**
 * Create a hash for the event data.
 * @param {Object} event - Event object to hash.
 * @returns {string} - SHA256 hash of the event data.
 */
function hashEvent(event) {
    const serializedEvent = JSON.stringify(event);
    return crypto.createHash("sha256").update(serializedEvent).digest("hex");
}

/**
 * Log an event to the blockchain.
 * @param {string} action - Action type (e.g., "TASK_COMPLETED", "CONFIG_LOADED").
 * @param {Object} data - Data associated with the event.
 * @returns {Promise<void>} - Resolves when the event is logged.
 */
async function logEventToBlockchain(action, data) {
    console.log(`Logging event to blockchain: ${action}...`);

    const event = {
        action,
        timestamp: new Date().toISOString(),
        data,
        hash: hashEvent(data),
    };

    const payload = JSON.stringify(event);

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            await sendToBlockchain(payload);
            console.log("Event logged successfully to the blockchain.");
            return;
        } catch (error) {
            attempt++;
            console.warn(`Attempt ${attempt} failed. Retrying...`, error.message);
            if (attempt === MAX_RETRIES) {
                console.error("Failed to log event to the blockchain after maximum retries.");
                throw error;
            }
        }
    }
}

/**
 * Send the event payload to the blockchain API.
 * @param {string} payload - JSON string of the event payload.
 * @returns {Promise<void>} - Resolves when the payload is successfully sent.
 */
function sendToBlockchain(payload) {
    return new Promise((resolve, reject) => {
        const options = {
            method: "POST",
            hostname: new URL(BLOCKCHAIN_API_URL).hostname,
            path: "/log",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                reject(new Error(`Blockchain API Error: ${res.statusCode} ${res.statusMessage}`));
            }
        });

        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

module.exports = {
    logEventToBlockchain,
};
