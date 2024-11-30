"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Smart Contract: Classifier Logic
//
// Description:
// This contract handles classification proposals and executions, enabling 
// data to be classified into actionable atomic structures with military-specific 
// extensions where required.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

class ClassifierLogicContract {
    constructor() {
        this.proposals = new Map(); // Store proposals keyed by userId
        this.executedClassifications = []; // Store executed classifications
    }

    /**
     * Create a classification proposal.
     * @param {string} userId - The ID of the user initiating the classification.
     * @param {string} inputType - The detected type of input data.
     * @returns {Object} - A classification proposal object.
     */
    createClassificationProposal(userId, inputType) {
        if (!userId || !inputType) {
            throw new Error("Both userId and inputType are required to create a proposal.");
        }

        const proposal = {
            userId,
            inputType,
            timestamp: new Date().toISOString(),
            status: "pending",
        };

        this.proposals.set(userId, proposal);
        console.log(`Classification proposal created for User ID: ${userId}`, proposal);
        return proposal;
    }

    /**
     * Execute a classification based on the proposal.
     * @param {Object} proposal - The classification proposal object.
     * @param {Object} classification - The classification details (type, size, etc.).
     * @returns {Object} - The result of the classification execution.
     */
    async executeClassification(proposal, classification) {
        if (!proposal || !classification) {
            throw new Error("Both proposal and classification are required for execution.");
        }

        if (proposal.status !== "pending") {
            throw new Error("This classification proposal has already been executed or invalidated.");
        }

        const result = {
            userId: proposal.userId,
            inputType: proposal.inputType,
            classification,
            executedAt: new Date().toISOString(),
        };

        // Mark the proposal as executed
        proposal.status = "executed";
        this.proposals.set(proposal.userId, proposal);

        // Store the result
        this.executedClassifications.push(result);
        console.log(`Classification executed for User ID: ${proposal.userId}`, result);
        return result;
    }

    /**
     * Get a proposal by User ID.
     * @param {string} userId - The ID of the user whose proposal is being queried.
     * @returns {Object|null} - The classification proposal or null if not found.
     */
    getProposal(userId) {
        return this.proposals.get(userId) || null;
    }

    /**
     * Get all executed classifications.
     * @returns {Array} - List of executed classifications.
     */
    getExecutedClassifications() {
        return this.executedClassifications;
    }
}

module.exports = ClassifierLogicContract;

// ------------------------------------------------------------------------------
// End of Smart Contract: Classifier Logic
// Version: 1.0.0 | Updated: 2024-10-30
// ------------------------------------------------------------------------------
