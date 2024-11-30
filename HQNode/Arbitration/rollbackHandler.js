"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Rollback Handler
//
// Description:
// Handles rollback operations for disputes and consensus failures in the ATOMIC
// HQ Node. Supports restoring previous blockchain states and reversing transactions
// to maintain data integrity.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../Monitoring/logger");

// **File Paths**
const BACKUP_DIR = path.resolve(__dirname, "../../Backups");
const LEDGER_PATH = path.resolve(__dirname, "../../atomic-blockchain/ledger.json");

/**
 * Initialize rollback handler.
 * Ensures the backup directory exists for storing rollback snapshots.
 */
async function initializeRollbackHandler() {
    try {
        console.log("Initializing rollback handler...");
        await fs.ensureDir(BACKUP_DIR);
        logInfo("Rollback handler initialized successfully.");
    } catch (error) {
        logError("Failed to initialize rollback handler:", error.message);
        throw new Error("Rollback handler initialization failed.");
    }
}

/**
 * Create a backup snapshot of the current ledger.
 * @param {string} snapshotId - Unique identifier for the snapshot.
 */
async function createBackupSnapshot(snapshotId) {
    try {
        const backupPath = path.join(BACKUP_DIR, `snapshot-${snapshotId}.json`);

        if (!(await fs.pathExists(LEDGER_PATH))) {
            throw new Error("Ledger file does not exist.");
        }

        await fs.copy(LEDGER_PATH, backupPath);
        logInfo(`Backup snapshot created: ${backupPath}`);
    } catch (error) {
        logError("Failed to create backup snapshot:", error.message);
        throw new Error("Failed to create ledger snapshot.");
    }
}

/**
 * Restore a ledger from a backup snapshot.
 * @param {string} snapshotId - Unique identifier of the snapshot to restore.
 */
async function restoreFromSnapshot(snapshotId) {
    try {
        const backupPath = path.join(BACKUP_DIR, `snapshot-${snapshotId}.json`);

        if (!(await fs.pathExists(backupPath))) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }

        await fs.copy(backupPath, LEDGER_PATH);
        logInfo(`Ledger restored from snapshot: ${backupPath}`);
    } catch (error) {
        logError("Failed to restore from snapshot:", error.message);
        throw new Error(`Rollback failed for snapshot ${snapshotId}.`);
    }
}

/**
 * Perform a transaction rollback.
 * @param {Object} transaction - The transaction to rollback.
 * @param {string} reason - Reason for rollback.
 */
async function rollbackTransaction(transaction, reason) {
    try {
        logInfo(`Rolling back transaction ${transaction.id}...`, { reason });

        // Example logic to modify the ledger (implementation depends on ledger structure)
        const ledger = await fs.readJson(LEDGER_PATH);
        ledger.transactions = ledger.transactions.filter((tx) => tx.id !== transaction.id);

        await fs.writeJson(LEDGER_PATH, ledger, { spaces: 2 });
        logInfo(`Transaction ${transaction.id} rolled back successfully.`);
    } catch (error) {
        logError(`Failed to rollback transaction ${transaction.id}:`, error.message);
        throw new Error(`Rollback failed for transaction ${transaction.id}.`);
    }
}

/**
 * Undo a block addition.
 * Removes the most recent block from the blockchain and restores its state.
 * @param {string} reason - Reason for rollback.
 */
async function rollbackBlock(reason) {
    try {
        logInfo("Rolling back the most recent block...", { reason });

        const ledger = await fs.readJson(LEDGER_PATH);

        if (ledger.blocks.length === 0) {
            throw new Error("No blocks to rollback.");
        }

        const removedBlock = ledger.blocks.pop();
        await fs.writeJson(LEDGER_PATH, ledger, { spaces: 2 });

        logInfo("Block rolled back successfully.", { removedBlock });
    } catch (error) {
        logError("Failed to rollback block:", error.message);
        throw new Error("Block rollback failed.");
    }
}

module.exports = {
    initializeRollbackHandler,
    createBackupSnapshot,
    restoreFromSnapshot,
    rollbackTransaction,
    rollbackBlock,
};

// ------------------------------------------------------------------------------
// End of Module: Rollback Handler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for rollback management in ATOMIC HQ Node.
// ------------------------------------------------------------------------------
