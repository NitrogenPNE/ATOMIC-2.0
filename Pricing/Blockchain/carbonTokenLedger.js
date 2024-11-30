"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Carbon Token Ledger
//
// Description:
// Handles the recording of token minting, redemption, and usage transactions
// within the ATOMIC blockchain ecosystem.
//
// Dependencies:
// - fs-extra: For managing ledger file operations.
// - path: For directory management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Ledger file paths
const tokenLedgerPath = path.resolve(__dirname, "../Logs/tokenLedger.json");

/**
 * Initialize the token ledger file if it does not exist.
 */
async function initializeLedger() {
    try {
        if (!(await fs.pathExists(tokenLedgerPath))) {
            console.log("Initializing token ledger...");
            await fs.writeJson(tokenLedgerPath, { transactions: [] }, { spaces: 2 });
        }
    } catch (error) {
        console.error("Error initializing token ledger:", error.message);
        throw error;
    }
}

/**
 * Record a transaction in the token ledger.
 * @param {Object} transaction - Transaction details (e.g., action, tokenId, amount).
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

        console.log("Token transaction recorded successfully.");
    } catch (error) {
        console.error("Error recording token transaction:", error.message);
        throw error;
    }
}

/**
 * Retrieve all transactions from the token ledger.
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
        console.log(`Filtering transactions for token ID: ${tokenId}`);
        const transactions = await getTokenTransactions();
        return transactions.filter((tx) => tx.tokenId === tokenId);
    } catch (error) {
        console.error("Error filtering token transactions:", error.message);
        throw error;
    }
}

/**
 * Main function to initialize ledger if called directly.
 */
if (require.main === module) {
    initializeLedger()
        .then(() => console.log("Token ledger initialized."))
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
};