"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Ledger Audit
 *
 * Description:
 * Implements a corporate-grade auditing mechanism for the ATOMIC blockchain ledger.
 * The module verifies shard integrity, transaction compliance, and anomaly detection.
 * Integrates with dispute resolution and reporting frameworks.
 *
 * Dependencies:
 * - ledgerManager.js: Provides access to ledger data and persistence utilities.
 * - corporateDisputeResolver.js: Handles flagged disputes during audits.
 * - validationUtils.js: Contains validation rules for shards and transactions.
 * - loggingUtils.js: Structured logging for audit trails.
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const { getShardData, getTransactionData } = require("../utils/ledgerManager");
const { validateShardIntegrity, validateTransaction } = require("../utils/validationUtils");
const { queueDispute } = require("./corporateDisputeResolver");
const { logEvent } = require("../utils/loggingUtils");

const AUDIT_LOG_PATH = path.resolve(__dirname, "../../logs/ledgerAuditLog.json");

/**
 * Perform a full ledger audit.
 * @returns {Promise<void>}
 */
async function performLedgerAudit() {
    console.log("Starting ledger audit...");
    try {
        const shardData = await getShardData();
        const transactionData = await getTransactionData();

        console.log("Auditing shard integrity...");
        for (const shard of shardData) {
            if (!validateShardIntegrity(shard)) {
                console.warn(`Shard integrity validation failed for shard ID: ${shard.id}`);
                await flagDispute("ShardIntegrity", { shardId: shard.id, data: shard });
            }
        }

        console.log("Auditing transactions...");
        for (const transaction of transactionData) {
            if (!validateTransaction(transaction)) {
                console.warn(`Transaction validation failed for transaction ID: ${transaction.id}`);
                await flagDispute("TransactionConflict", { transactionId: transaction.id, data: transaction });
            }
        }

        console.log("Ledger audit completed successfully.");
        await logEvent("LedgerAudit", { status: "completed", timestamp: new Date().toISOString() });
    } catch (error) {
        console.error("Ledger audit failed:", error.message);
        await logEvent("LedgerAudit", { status: "failed", error: error.message, timestamp: new Date().toISOString() });
        throw error;
    }
}

/**
 * Flag a dispute for further resolution.
 * @param {string} disputeType - Type of dispute (e.g., ShardIntegrity, TransactionConflict).
 * @param {Object} details - Details of the flagged dispute.
 * @returns {Promise<void>}
 */
async function flagDispute(disputeType, details) {
    console.log(`Flagging dispute: ${disputeType}`);
    try {
        await queueDispute(disputeType, details);
        console.log(`Dispute flagged successfully: ${disputeType}`);
    } catch (error) {
        console.error(`Failed to flag dispute of type '${disputeType}':`, error.message);
    }
}

/**
 * Generate an audit report summarizing the results.
 * @returns {Promise<Object>} - Audit summary report.
 */
async function generateAuditReport() {
    console.log("Generating audit report...");
    try {
        const shardData = await getShardData();
        const transactionData = await getTransactionData();

        const report = {
            totalShards: shardData.length,
            totalTransactions: transactionData.length,
            timestamp: new Date().toISOString(),
        };

        // Log the report for compliance
        await logEvent("AuditReport", report);

        console.log("Audit report generated successfully.");
        return report;
    } catch (error) {
        console.error("Failed to generate audit report:", error.message);
        throw error;
    }
}

module.exports = {
    performLedgerAudit,
    generateAuditReport,
};
