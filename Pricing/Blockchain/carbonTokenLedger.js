"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Carbon Token Ledger
 *
 * Description:
 * Handles the recording of token minting, redemption, and usage transactions
 * within the ATOMIC blockchain ecosystem. Includes Proof-of-Access (PoA) metadata
 * and enhanced logging for token ownership and carbon-related operations.
 *
 * Dependencies:
 * - fs-extra: For managing ledger file operations.
 * - path: For directory management.
 * - crypto: For generating secure transaction IDs.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

// Ledger file paths
const tokenLedgerPath = path.resolve(__dirname, "../Logs/carbonTokenLedger.json");

/**
 * Initialize the carbon token ledger file if it does not exist.
 */
async function initializeLedger() {
    try {
        if (!(await fs.pathExists(tokenLedgerPath))) {
            console.log("Initializing carbon token ledger...");
            await fs.writeJson(tokenLedgerPath, { transactions: [] }, { spaces: 2 });
        }
    } catch (error) {
        console.error("Error initializing carbon token ledger:", error.message);
        throw error;
    }
}

/**
 * Record a token transaction in the carbon token ledger with PoA metadata.
 * @param {Object} transaction - Transaction details.
 * @param {string} transaction.action - Action performed (e.g., "MINT", "REDEEM", "USAGE").
 * @param {string} transaction.tokenId - Unique identifier for the token involved.
 * @param {Object} transaction.metadata - Additional metadata, including token ownership and PoA details.
 * @param {string} transaction.nodeId - Node associated with the transaction.
 * @param {Object} [transaction.carbonMetrics] - Optional carbon-related metrics (e.g., footprint, credits used).
 */
async function recordTokenTransaction(transaction) {
    try {
        console.log("Recording token transaction...");
        const ledger = await fs.readJson(tokenLedgerPath);

        const ledgerEntry = {
            transactionId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...transaction,
        };

        ledger.transactions.push(ledgerEntry);
        await fs.writeJson(tokenLedgerPath, ledger, { spaces: 2 });

        console.log(`Token transaction recorded: ${transaction.action} for Token ID: ${transaction.tokenId}`);
    } catch (error) {
        console.error("Error recording token transaction:", error.message);
        throw error;
    }
}

/**
 * Retrieve all transactions from the carbon token ledger.
 * @returns {Array} - List of all token transactions.
 */
async function getTokenTransactions() {
    try {
        console.log("Retrieving carbon token transactions...");
        const ledger = await fs.readJson(tokenLedgerPath);
        return ledger.transactions;
    } catch (error) {
        console.error("Error retrieving token transactions:", error.message);
        throw error;
    }
}

/**
 * Filter transactions by token ID.
 * @param {string} tokenId - Token ID to filter by.
 * @returns {Array} - List of transactions for the specified token.
 */
async function getTransactionsByTokenId(tokenId) {
    try {
        console.log(`Filtering transactions for Token ID: ${tokenId}`);
        const transactions = await getTokenTransactions();
        return transactions.filter((tx) => tx.tokenId === tokenId);
    } catch (error) {
        console.error("Error filtering token transactions by Token ID:", error.message);
        throw error;
    }
}

/**
 * Filter transactions by action type.
 * @param {string} action - Action type to filter by (e.g., "MINT", "REDEEM").
 * @returns {Array} - List of transactions matching the specified action.
 */
async function getTransactionsByAction(action) {
    try {
        console.log(`Filtering transactions by action: ${action}`);
        const transactions = await getTokenTransactions();
        return transactions.filter((tx) => tx.action === action);
    } catch (error) {
        console.error("Error filtering token transactions by action:", error.message);
        throw error;
    }
}

/**
 * Filter transactions by node ID.
 * @param {string} nodeId - Node ID to filter transactions.
 * @returns {Array} - List of transactions associated with the specified node.
 */
async function getTransactionsByNodeId(nodeId) {
    try {
        console.log(`Filtering transactions for Node ID: ${nodeId}`);
        const transactions = await getTokenTransactions();
        return transactions.filter((tx) => tx.nodeId === nodeId);
    } catch (error) {
        console.error("Error filtering token transactions by Node ID:", error.message);
        throw error;
    }
}

/**
 * Main function to initialize the ledger if called directly.
 */
if (require.main === module) {
    initializeLedger()
        .then(() => console.log("Carbon token ledger initialized successfully."))
        .catch((error) => {
            console.error("Critical error during ledger initialization:", error.message);
            process.exit(1);
        });
}

module.exports = {
    initializeLedger,
    recordTokenTransaction,
    getTokenTransactions,
    getTransactionsByTokenId,
    getTransactionsByAction,
    getTransactionsByNodeId,
};
