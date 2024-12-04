"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Token Transaction Ledger
 *
 * Description:
 * Handles logging and retrieval of token-related transactions within the ATOMIC
 * blockchain ecosystem. Includes Proof-of-Access (PoA) tracking, transfers,
 * redemptions, and allocations while ensuring comprehensive auditability.
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
const tokenLedgerPath = path.resolve(__dirname, "../Logs/tokenTransactionLedger.json");

/**
 * Initialize the token transaction ledger if it does not exist.
 */
async function initializeLedger() {
    try {
        if (!(await fs.pathExists(tokenLedgerPath))) {
            console.log("Initializing token transaction ledger...");
            await fs.writeJson(tokenLedgerPath, { transactions: [] }, { spaces: 2 });
        }
    } catch (error) {
        console.error("Error initializing token transaction ledger:", error.message);
        throw error;
    }
}

/**
 * Record a token transaction in the ledger with Proof-of-Access metadata.
 * @param {Object} transaction - Transaction details.
 * @param {string} transaction.action - The action being performed (e.g., "MINT", "REDEEM", "TRANSFER").
 * @param {string} transaction.tokenId - The ID of the token involved.
 * @param {string} transaction.nodeId - The ID of the node associated with the transaction.
 * @param {Object} transaction.metadata - Additional transaction details (e.g., operation type, shard usage).
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
 * Retrieve all transactions from the token transaction ledger.
 * @returns {Array} - List of all token transactions.
 */
async function getTokenTransactions() {
    try {
        console.log("Retrieving token transactions...");
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
        console.error("Error filtering token transactions:", error.message);
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
 * Filter transactions by action type.
 * @param {string} action - The action type to filter by (e.g., "MINT", "REDEEM").
 * @returns {Array} - List of transactions matching the specified action.
 */
async function getTransactionsByAction(action) {
    try {
        console.log(`Filtering transactions by action type: ${action}`);
        const transactions = await getTokenTransactions();
        return transactions.filter((tx) => tx.action === action);
    } catch (error) {
        console.error("Error filtering token transactions by action:", error.message);
        throw error;
    }
}

/**
 * Main function to initialize the ledger if called directly.
 */
if (require.main === module) {
    initializeLedger()
        .then(() => console.log("Token transaction ledger initialized successfully."))
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
    getTransactionsByNodeId,
    getTransactionsByAction,
};
