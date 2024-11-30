"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Data Classifier Contract
//
// Description:
// This contract governs the classification of data into atomic units. It ensures
// integrity, compliance, and traceability for classification proposals and executions.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

class DataClassifierContract {
    constructor() {
        this.proposals = {}; // Stores proposals with a unique identifier
    }

    /**
     * Creates a classification proposal for the given user and type.
     * @param {string} userId - The user requesting classification.
     * @param {string} inputType - The type of the data being classified.
     * @returns {Object} - A unique proposal object.
     */
    createProposal(userId, inputType) {
        const proposalId = `${userId}-${Date.now()}`;
        const proposal = {
            id: proposalId,
            userId,
            inputType,
            status: "pending",
            timestamp: new Date().toISOString(),
        };

        this.proposals[proposalId] = proposal;
        console.log(`Classification proposal created:`, proposal);
        return proposal;
    }

    /**
     * Executes a classification proposal with the provided atom structures.
     * @param {Object} proposal - The proposal object.
     * @param {Object} classifiedAtoms - The atomic structures created.
     * @returns {Object} - Execution result with metadata.
     */
    async executeProposal(proposal, classifiedAtoms) {
        if (!this.proposals[proposal.id]) {
            throw new Error(`Proposal ID ${proposal.id} not found.`);
        }

        // Validate the proposal's integrity
        if (proposal.status !== "pending") {
            throw new Error(`Proposal ID ${proposal.id} is not in a valid state.`);
        }

        // Execute the classification process
        proposal.status = "completed";
        proposal.result = classifiedAtoms;
        proposal.completedAt = new Date().toISOString();

        console.log(`Proposal executed successfully:`, proposal);

        return {
            success: true,
            proposalId: proposal.id,
            classifiedAtoms,
            timestamp: proposal.completedAt,
        };
    }

    /**
     * Retrieves a proposal by ID.
     * @param {string} proposalId - The ID of the proposal to retrieve.
     * @returns {Object|null} - The proposal object or null if not found.
     */
    getProposal(proposalId) {
        return this.proposals[proposalId] || null;
    }

    /**
     * List all proposals for administrative purposes.
     * @returns {Array} - Array of all stored proposals.
     */
    listProposals() {
        return Object.values(this.proposals);
    }
}

module.exports = DataClassifierContract;
