"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Corporate Dispute Resolver
 *
 * Description:
 * Implements a corporate-grade dispute resolution mechanism for the ATOMIC
 * blockchain. This module acts as a high-level coordinator that uses arbitration
 * policies and consensus arbitration to resolve disputes.
 *
 * Dependencies:
 * - arbitrationPolicy.json: Provides resolution strategies and thresholds.
 * - consensusArbitrator.js: Executes arbitration logic.
 * - loggingUtils.js: Handles structured event logging.
 * - notificationManager.js: Sends alerts and notifications for disputes.
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const fs = require("fs-extra");
const { handleDispute } = require("./consensusArbitrator");
const { logEvent } = require("../utils/loggingUtils");
const { sendNotification } = require("../utils/notificationManager");

const ARBITRATION_POLICY_PATH = path.resolve(__dirname, "./arbitrationPolicy.json");
const DISPUTE_QUEUE_PATH = path.resolve(__dirname, "../../data/disputeQueue.json");
const RESOLVED_DISPUTES_LOG = path.resolve(__dirname, "../../logs/resolvedDisputes.json");

/**
 * Load the arbitration policy.
 */
async function loadArbitrationPolicy() {
    try {
        const policy = await fs.readJson(ARBITRATION_POLICY_PATH);
        console.log("Loaded arbitration policy successfully.");
        return policy;
    } catch (error) {
        console.error("Failed to load arbitration policy:", error.message);
        throw new Error("Arbitration policy load failure.");
    }
}

/**
 * Queue a dispute for processing.
 * @param {string} disputeType - Type of dispute (e.g., ShardIntegrity, TransactionConflict).
 * @param {Object} disputeDetails - Details of the dispute.
 * @returns {Promise<void>}
 */
async function queueDispute(disputeType, disputeDetails) {
    try {
        const disputeQueue = await fs.readJson(DISPUTE_QUEUE_PATH).catch(() => []);
        const newDispute = {
            type: disputeType,
            details: disputeDetails,
            timestamp: new Date().toISOString(),
        };
        disputeQueue.push(newDispute);
        await fs.writeJson(DISPUTE_QUEUE_PATH, disputeQueue, { spaces: 2 });
        console.log(`Dispute queued: ${disputeType}`);
    } catch (error) {
        console.error("Failed to queue dispute:", error.message);
        throw error;
    }
}

/**
 * Process the dispute queue.
 */
async function processDisputeQueue() {
    try {
        const disputeQueue = await fs.readJson(DISPUTE_QUEUE_PATH).catch(() => []);
        const arbitrationPolicy = await loadArbitrationPolicy();

        for (const dispute of disputeQueue) {
            try {
                console.log(`Processing dispute: ${dispute.type}`);
                const resolution = await handleDispute(
                    dispute.type,
                    dispute.details,
                    arbitrationPolicy.peers
                );

                // Log resolution details
                await logResolution(dispute, resolution);

                // Notify relevant parties
                await sendNotification(
                    "DisputeResolved",
                    `Dispute of type '${dispute.type}' resolved successfully.`,
                    { dispute, resolution }
                );

                // Remove the resolved dispute from the queue
                disputeQueue.splice(disputeQueue.indexOf(dispute), 1);
            } catch (error) {
                console.error(`Failed to process dispute of type ${dispute.type}:`, error.message);
            }
        }

        // Save the updated dispute queue
        await fs.writeJson(DISPUTE_QUEUE_PATH, disputeQueue, { spaces: 2 });
    } catch (error) {
        console.error("Failed to process dispute queue:", error.message);
        throw error;
    }
}

/**
 * Log dispute resolution details.
 * @param {Object} dispute - The dispute that was resolved.
 * @param {Object} resolution - The resolution details.
 */
async function logResolution(dispute, resolution) {
    try {
        const resolvedLog = {
            dispute,
            resolution,
            resolvedAt: new Date().toISOString(),
        };
        await fs.appendFile(RESOLVED_DISPUTES_LOG, JSON.stringify(resolvedLog) + "\n");
        console.log(`Dispute resolution logged: ${dispute.type}`);
    } catch (error) {
        console.error("Failed to log dispute resolution:", error.message);
    }
}

/**
 * Handle escalated disputes.
 * @param {string} disputeType - Type of dispute.
 * @param {Object} disputeDetails - Dispute details.
 * @param {Array} escalationPath - List of nodes or roles for escalation.
 * @returns {Promise<void>}
 */
async function handleEscalatedDispute(disputeType, disputeDetails, escalationPath) {
    try {
        console.log(`Escalating dispute of type '${disputeType}'...`);
        for (const node of escalationPath) {
            await sendNotification(
                "DisputeEscalation",
                `Dispute of type '${disputeType}' escalated to ${node}.`,
                { disputeType, disputeDetails, node }
            );
        }
        console.log(`Dispute escalation for '${disputeType}' completed.`);
    } catch (error) {
        console.error("Failed to escalate dispute:", error.message);
        throw error;
    }
}

/**
 * Entry point for resolving disputes.
 * Routes disputes through appropriate resolution mechanisms.
 * @param {string} disputeType - Type of dispute (e.g., ShardIntegrity, TransactionConflict).
 * @param {Object} disputeDetails - Details of the dispute.
 */
async function resolveDispute(disputeType, disputeDetails) {
    try {
        console.log(`Resolving dispute of type: ${disputeType}`);
        const arbitrationPolicy = await loadArbitrationPolicy();

        // Check if dispute requires escalation
        const escalationPath = arbitrationPolicy.escalationPaths[disputeType];
        if (escalationPath) {
            console.log(`Escalating dispute: ${disputeType}`);
            await handleEscalatedDispute(disputeType, disputeDetails, escalationPath);
            return;
        }

        // Handle dispute directly
        const resolution = await handleDispute(
            disputeType,
            disputeDetails,
            arbitrationPolicy.peers
        );

        console.log(`Dispute resolved: ${disputeType}`);
        await logResolution({ type: disputeType, details: disputeDetails }, resolution);
    } catch (error) {
        console.error(`Failed to resolve dispute of type '${disputeType}':`, error.message);
        throw error;
    }
}

module.exports = {
    resolveDispute,
    queueDispute,
    processDisputeQueue,
};
