"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Dispute Manager
//
// Description:
// Manages disputes in the ATOMIC blockchain network. Handles recording, categorizing,
// and escalating disputes to the consensus arbitrator. Stores disputes for audit purposes
// and ensures proper logging for resolution tracking.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const ConsensusArbitrator = require("./consensusArbitrator");

// **File Paths**
const DISPUTES_FILE = path.resolve(__dirname, "arbitrationLogs.json");
const POLICY_FILE = path.resolve(__dirname, "arbitrationPolicy.json");

// **Dispute Manager Class**
class DisputeManager {
    constructor() {
        this.disputes = [];
        this.policy = {};
        this.arbitrator = new ConsensusArbitrator();
    }

    /**
     * Initialize the dispute manager.
     */
    async initialize() {
        console.log("Initializing Dispute Manager...");
        try {
            this.disputes = (await fs.readJson(DISPUTES_FILE)).arbitrationLogs.logs || [];
            console.log("Dispute logs loaded successfully.");
        } catch (error) {
            console.warn("Failed to load dispute logs. Starting with an empty log.");
            this.disputes = [];
        }

        try {
            this.policy = await fs.readJson(POLICY_FILE);
            console.log("Arbitration policy loaded successfully.");
        } catch (error) {
            console.error("Failed to load arbitration policy:", error.message);
            throw new Error("Failed to initialize arbitration policy.");
        }

        await this.arbitrator.initialize();
    }

    /**
     * Record a new dispute.
     * @param {string} type - Type of the dispute (e.g., "transaction-dispute").
     * @param {Object} details - Details of the dispute (e.g., transaction ID, reason).
     * @returns {Object} - Recorded dispute.
     */
    async recordDispute(type, details) {
        console.log(`Recording dispute of type: ${type}`);
        const disputeId = `DISPUTE-${this.disputes.length + 1}`;

        const dispute = {
            id: disputeId,
            type,
            details,
            status: "Pending",
            timestamp: new Date().toISOString(),
        };

        this.disputes.push(dispute);

        try {
            await this.saveDisputes();
            console.log(`Dispute recorded successfully with ID: ${disputeId}`);
        } catch (error) {
            console.error("Failed to save dispute record:", error.message);
            throw new Error("Failed to record dispute.");
        }

        return dispute;
    }

    /**
     * Escalate a dispute to the consensus arbitrator for resolution.
     * @param {string} disputeId - ID of the dispute to escalate.
     * @returns {Object} - Resolution outcome.
     */
    async escalateDispute(disputeId) {
        console.log(`Escalating dispute with ID: ${disputeId}`);
        const dispute = this.disputes.find((d) => d.id === disputeId);

        if (!dispute) {
            throw new Error(`Dispute with ID ${disputeId} not found.`);
        }

        if (dispute.status !== "Pending") {
            console.warn(`Dispute ${disputeId} has already been resolved or escalated.`);
            return { status: "Already Processed", dispute };
        }

        try {
            const resolution = await this.arbitrator.resolveDispute(disputeId, dispute.details);
            dispute.status = resolution.status;
            dispute.resolution = resolution.resolution;

            await this.saveDisputes();
            console.log(`Dispute ${disputeId} escalated and resolved.`);
            return resolution;
        } catch (error) {
            console.error(`Failed to escalate dispute ${disputeId}:`, error.message);
            throw new Error(`Failed to escalate dispute ${disputeId}: ${error.message}`);
        }
    }

    /**
     * Save disputes to the dispute log file.
     */
    async saveDisputes() {
        try {
            const logsFileContent = { arbitrationLogs: { logs: this.disputes } };
            await fs.writeJson(DISPUTES_FILE, logsFileContent, { spaces: 2 });
            console.log("Dispute logs saved successfully.");
        } catch (error) {
            console.error("Failed to save dispute logs:", error.message);
            throw error;
        }
    }

    /**
     * Retrieve all disputes.
     * @returns {Object[]} - List of all recorded disputes.
     */
    getAllDisputes() {
        return this.disputes;
    }

    /**
     * Retrieve disputes by status.
     * @param {string} status - Filter disputes by status (e.g., "Pending", "Resolved").
     * @returns {Object[]} - Filtered disputes.
     */
    getDisputesByStatus(status) {
        return this.disputes.filter((dispute) => dispute.status === status);
    }
}

// **Export Dispute Manager**
module.exports = DisputeManager;

// ------------------------------------------------------------------------------
// End of Module: Dispute Manager
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for ATOMIC HQ Node arbitration processes.
// ------------------------------------------------------------------------------
