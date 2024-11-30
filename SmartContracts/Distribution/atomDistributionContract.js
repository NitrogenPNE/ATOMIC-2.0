"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Atom Distribution Contract
//
// Description:
// This contract governs the logging of distribution metadata and proposals 
// on the blockchain. It supports multi-node distribution, integrates 
// military-specific operations, and ensures traceability for all distribution 
// events.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

class AtomDistributionContract {
    constructor() {
        this.distributionProposals = {}; // Store distribution proposals
        this.distributionLogs = []; // Log executed distributions
    }

    /**
     * Creates a distribution proposal for data atoms.
     * @param {string} userId - ID of the user initiating the distribution.
     * @param {Array} nodes - Nodes targeted for distribution.
     * @param {string} dataType - The type of data being distributed.
     * @returns {Object} - A unique distribution proposal object.
     */
    createDistributionProposal(userId, nodes, dataType) {
        const proposalId = `${userId}-${Date.now()}`;
        const proposal = {
            id: proposalId,
            userId,
            nodes,
            dataType,
            status: "pending",
            createdAt: new Date().toISOString(),
        };

        this.distributionProposals[proposalId] = proposal;
        console.log(`Distribution proposal created:`, proposal);
        return proposal;
    }

    /**
     * Executes a distribution proposal.
     * @param {Object} proposal - The distribution proposal object.
     * @param {Object} distributionMetadata - Metadata related to the distribution (e.g., atom size, frequency).
     * @returns {Object} - Execution result with metadata.
     */
    executeDistribution(proposal, distributionMetadata) {
        if (!this.distributionProposals[proposal.id]) {
            throw new Error(`Proposal ID ${proposal.id} not found.`);
        }

        // Validate proposal state
        if (proposal.status !== "pending") {
            throw new Error(`Proposal ID ${proposal.id} is not in a valid state.`);
        }

        // Perform distribution (mocking blockchain logging for demonstration)
        proposal.status = "completed";
        proposal.metadata = distributionMetadata;
        proposal.completedAt = new Date().toISOString();

        this.distributionLogs.push({
            proposalId: proposal.id,
            userId: proposal.userId,
            nodes: proposal.nodes,
            metadata: distributionMetadata,
            timestamp: proposal.completedAt,
        });

        console.log(`Distribution executed successfully:`, proposal);

        return {
            success: true,
            proposalId: proposal.id,
            distributionMetadata,
            timestamp: proposal.completedAt,
        };
    }

    /**
     * Retrieves a specific distribution proposal by ID.
     * @param {string} proposalId - The ID of the proposal to retrieve.
     * @returns {Object|null} - The proposal object or null if not found.
     */
    getProposal(proposalId) {
        return this.distributionProposals[proposalId] || null;
    }

    /**
     * Lists all distribution proposals.
     * @returns {Array} - Array of all distribution proposals.
     */
    listProposals() {
        return Object.values(this.distributionProposals);
    }

    /**
     * Lists all executed distribution logs for audit and tracking purposes.
     * @returns {Array} - Array of executed distribution logs.
     */
    listDistributionLogs() {
        return this.distributionLogs;
    }

    /**
     * Logs military-specific operations with enhanced parameters.
     * @param {Object} operationData - Details of the military-specific operation.
     * @returns {Object} - Confirmation of the logged operation.
     */
    logMilitaryOperation(operationData) {
        const logEntry = {
            operationId: `military-${Date.now()}`,
            ...operationData,
            timestamp: new Date().toISOString(),
        };

        this.distributionLogs.push(logEntry);
        console.log(`Military-specific operation logged:`, logEntry);

        return {
            success: true,
            operationId: logEntry.operationId,
            timestamp: logEntry.timestamp,
        };
    }
}

module.exports = AtomDistributionContract;
