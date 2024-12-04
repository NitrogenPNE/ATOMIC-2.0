"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Blockchain Logger
//
// Description:
// Provides utilities for logging pricing and token-related events to the ATOMIC
// blockchain. Communicates directly with the blockchain node.
//
// Dependencies:
// - axios: For HTTP communication with the blockchain node API.
// - path: For managing blockchain-related configurations and logs.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

// Configurations
const BLOCKCHAIN_NODE_URL = "http://localhost:8000"; // Replace with actual node URL or network address
const LOG_PATH = path.resolve(__dirname, "../Logs/blockchainLogger.log");

/**
 * Send a transaction to the blockchain node.
 * @param {Object} transactionData - The data to log on the blockchain.
 * @returns {Promise<Object>} - Blockchain response or error details.
 */
async function logToBlockchain(transactionData) {
    try {
        console.log("Sending transaction to blockchain...");

        const response = await axios.post(`${BLOCKCHAIN_NODE_URL}/api/transactions`, transactionData);

        console.log("Transaction logged on blockchain successfully:", response.data);

        // Log the success locally
        await logLocally({
            status: "success",
            timestamp: new Date().toISOString(),
            transactionData,
            blockchainResponse: response.data,
        });

        return response.data;
    } catch (error) {
        console.error("Error logging to blockchain:", error.message);

        // Log the failure locally
        await logLocally({
            status: "failure",
            timestamp: new Date().toISOString(),
            transactionData,
            error: error.message,
        });

        throw error;
    }
}

/**
 * Log transactions locally in case of failure or for audit purposes.
 * @param {Object} logEntry - Details of the transaction to log locally.
 */
async function logLocally(logEntry) {
    try {
        const logData = JSON.stringify(logEntry, null, 2);
        await fs.appendFile(LOG_PATH, logData + ",\n");
        console.log("Transaction logged locally.");
    } catch (error) {
        console.error("Failed to log transaction locally:", error.message);
    }
}

/**
 * Mint tokens and log the transaction on the blockchain.
 * @param {Object} mintData - Data for minting tokens (e.g., tokenId, amount, owner).
 * @returns {Promise<Object>} - Blockchain transaction details.
 */
async function mintTokens(mintData) {
    const transactionData = {
        type: "TOKEN_MINT",
        data: mintData,
    };

    return await logToBlockchain(transactionData);
}

/**
 * Record shard transactions and log them on the blockchain.
 * @param {Object} shardTransaction - Data for shard transactions (e.g., shardId, owner, size, carbon).
 * @returns {Promise<Object>} - Blockchain transaction details.
 */
async function logShardTransaction(shardTransaction) {
    const transactionData = {
        type: "SHARD_TRANSACTION",
        data: shardTransaction,
    };

    return await logToBlockchain(transactionData);
}

/**
 * Record carbon rebates and log them on the blockchain.
 * @param {Object} rebateData - Data for carbon rebate (e.g., userId, amount, carbonSavings).
 * @returns {Promise<Object>} - Blockchain transaction details.
 */
async function logCarbonRebate(rebateData) {
    const transactionData = {
        type: "CARBON_REBATE",
        data: rebateData,
    };

    return await logToBlockchain(transactionData);
}

// Example usage if run directly
if (require.main === module) {
    (async () => {
        try {
            console.log("Testing blockchain logger...");

            const testMint = await mintTokens({
                tokenId: "atom123",
                amount: 1000,
                owner: "user_01",
            });
            console.log("Mint Test:", testMint);

            const testShard = await logShardTransaction({
                shardId: "shard001",
                owner: "user_01",
                size: "9.66GB",
                carbon: "202.86g",
            });
            console.log("Shard Test:", testShard);

            const testRebate = await logCarbonRebate({
                userId: "user_01",
                amount: "5.13CAD",
                carbonSavings: "78.99g",
            });
            console.log("Rebate Test:", testRebate);
        } catch (error) {
            console.error("Error in testing blockchain logger:", error.message);
        }
    })();
}

module.exports = {
    logToBlockchain,
    mintTokens,
    logShardTransaction,
    logCarbonRebate,
};