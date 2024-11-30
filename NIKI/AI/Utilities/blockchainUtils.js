"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Blockchain Utilities
//
// Description:
// Provides blockchain integration for NIKI using the ATOMIC Blockchain.
// Features include immutable logging, secure transaction management, and
// shard-specific interactions.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For secure hash generation.
// - winston: For structured logging.
// ------------------------------------------------------------------------------

const crypto = require("crypto"); // For secure hash generation
const winston = require("winston"); // For structured logging
const { sendTransactionToAtomicChain, initializeAtomicBlockchain } = require("../Utilities/atomicChainAPI"); // ATOMIC Blockchain SDK

// **Blockchain Configuration**
const BLOCKCHAIN_CONFIG = {
    endpoint: process.env.ATOMIC_CHAIN_ENDPOINT || "http://localhost:8545", // Replace with your ATOMIC blockchain endpoint
    nodeId: process.env.NODE_ID || "NIKI-001",
    privateKey: process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY", // For signing transactions
};

// **Initialize ATOMIC Blockchain**
let atomicChain;
try {
    atomicChain = initializeAtomicBlockchain(BLOCKCHAIN_CONFIG.endpoint);
    console.log("ATOMIC Blockchain initialized successfully.");
} catch (error) {
    console.error("Error initializing ATOMIC Blockchain:", error.message);
    process.exit(1); // Exit the application if the blockchain initialization fails
}

// **Logger Configuration**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

/**
 * Log an event to the ATOMIC Blockchain.
 * @param {string} eventType - Type of event (e.g., "tamperDetected", "shardAllocated").
 * @param {Object} eventData - Event data to log.
 * @returns {Promise<string>} - Transaction ID of the logged event.
 */
async function logEventToBlockchain(eventType, eventData) {
    try {
        logger.info(`Logging event to ATOMIC Blockchain: ${eventType}`, { eventData });

        // Generate a secure hash of the event data
        const eventHash = crypto.createHash("sha256").update(JSON.stringify(eventData)).digest("hex");

        // Prepare the transaction payload
        const transactionPayload = {
            nodeId: BLOCKCHAIN_CONFIG.nodeId,
            eventType,
            eventHash,
            timestamp: new Date().toISOString(),
        };

        // Send transaction to the ATOMIC blockchain
        const transactionId = await sendTransactionToAtomicChain(
            atomicChain,
            transactionPayload,
            BLOCKCHAIN_CONFIG.privateKey
        );

        logger.info("Event successfully logged to ATOMIC Blockchain", { transactionId });
        return transactionId;
    } catch (error) {
        logger.error("Error logging event to ATOMIC Blockchain", { error });
        throw error;
    }
}

module.exports = {
    logEventToBlockchain,
};