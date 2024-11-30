"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Dispute Manager
//
// Description:
// This module manages disputes within the National Defense HQ Node. It identifies
// conflicts, assigns priorities based on the arbitration policy, and resolves disputes
// using pre-defined protocols. Dispute logs are maintained for audits and compliance.
//
// Features:
// - Receives and categorizes disputes.
// - Assigns resolution protocols based on dispute type and priority.
// - Tracks and updates the status of disputes in real-time.
// - Maintains comprehensive logs of dispute resolutions.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { loadArbitrationPolicy, logArbitrationEvent } = require("./defenseArbitrationEngine");

// Paths to Logs
const disputeLogsPath = path.resolve(__dirname, "../../Logs/disputeLogs.json");

// **Create or Update Dispute Log**
async function updateDisputeLog(disputeId, update) {
    try {
        await fs.ensureFile(disputeLogsPath);
        const logs = (await fs.readJson(disputeLogsPath, { throws: false })) || [];
        const disputeIndex = logs.findIndex((log) => log.disputeId === disputeId);

        if (disputeIndex >= 0) {
            logs[disputeIndex] = { ...logs[disputeIndex], ...update };
        } else {
            logs.push(update);
        }

        await fs.writeJson(disputeLogsPath, logs, { spaces: 2 });
        console.log(`Dispute log updated for ID: ${disputeId}`);
    } catch (error) {
        console.error("Failed to update dispute log:", error.message);
    }
}

// **Handle Dispute**
async function handleDispute(dispute) {
    try {
        console.log("Handling dispute:", dispute);

        const policy = await loadArbitrationPolicy();
        const { disputeType, priorityLevel } = dispute;

        // Validate dispute type
        const disputeConfig = policy.disputeTypes[disputeType];
        if (!disputeConfig) {
            throw new Error(`Invalid dispute type: ${disputeType}`);
        }

        // Validate priority level
        const priorityConfig = policy.priorityLevels[priorityLevel];
        if (!priorityConfig) {
            throw new Error(`Invalid priority level: ${priorityLevel}`);
        }

        // Log dispute initiation
        const disputeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await updateDisputeLog(disputeId, {
            disputeId,
            ...dispute,
            status: "In Progress",
            initiatedAt: new Date().toISOString(),
        });

        await logArbitrationEvent({
            type: "Dispute Initiation",
            disputeId,
            details: dispute,
        });

        // Resolve dispute
        console.log(`Resolving dispute using protocol: ${disputeConfig.resolutionProtocol}`);
        const resolution = `Resolved via protocol: ${disputeConfig.resolutionProtocol}`;

        // Update dispute log
        await updateDisputeLog(disputeId, {
            resolution,
            status: "Resolved",
            resolvedAt: new Date().toISOString(),
        });

        await logArbitrationEvent({
            type: "Dispute Resolution",
            disputeId,
            resolution,
            status: "Resolved",
        });

        return resolution;
    } catch (error) {
        console.error("Error handling dispute:", error.message);
        throw error;
    }
}

// **Exported Functions**
module.exports = {
    handleDispute,
    updateDisputeLog,
};

// ------------------------------------------------------------------------------
// End of Dispute Manager
// Version: 1.0.0 | Updated: 2024-11-24
// ------------------------------------------------------------------------------
