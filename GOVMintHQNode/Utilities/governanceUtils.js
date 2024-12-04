"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Governance Utilities
 *
 * Description:
 * Provides utility functions for governance operations, including signature
 * validation, governance node management, and quorum calculation.
 *
 * Author: ATOMIC Development Team
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

// Paths
const GOVERNANCE_NODES_PATH = path.resolve(__dirname, "../Config/governanceNodes.json");

/**
 * Retrieves the list of governance nodes.
 * @returns {Promise<Array>} - List of governance nodes.
 */
async function getGovernanceNodes() {
    try {
        if (!(await fs.pathExists(GOVERNANCE_NODES_PATH))) {
            throw new Error("Governance nodes configuration not found.");
        }

        const governanceNodes = await fs.readJson(GOVERNANCE_NODES_PATH);
        return governanceNodes.nodes || [];
    } catch (error) {
        console.error("Error retrieving governance nodes:", error.message);
        throw error;
    }
}

/**
 * Validates signatures from governance nodes for a given action hash.
 * @param {Array<{ nodeId: string, signature: string }>} signatures - Signatures to validate.
 * @param {string} actionHash - The hash of the action to validate against.
 * @returns {Promise<boolean>} - True if signatures meet quorum requirements, false otherwise.
 */
async function validateSignatures(signatures, actionHash) {
    try {
        console.log("Validating governance signatures...");

        const governanceNodes = await getGovernanceNodes();
        const validSignatures = signatures.filter(({ nodeId, signature }) => {
            const node = governanceNodes.find((n) => n.nodeId === nodeId);

            if (!node) {
                console.warn(`Node ID ${nodeId} is not recognized.`);
                return false;
            }

            const publicKey = node.publicKey;
            return crypto.verify(
                "sha256",
                Buffer.from(actionHash),
                publicKey,
                Buffer.from(signature, "hex")
            );
        });

        const quorumRequired = Math.ceil(governanceNodes.length * 0.67); // 67% quorum
        const quorumMet = validSignatures.length >= quorumRequired;

        console.log(
            `Signatures validated. Total: ${signatures.length}, Valid: ${validSignatures.length}, Quorum Required: ${quorumRequired}, Quorum Met: ${quorumMet}`
        );

        return quorumMet;
    } catch (error) {
        console.error("Error validating signatures:", error.message);
        throw error;
    }
}

/**
 * Calculates the quorum threshold for governance decisions.
 * @param {number} totalNodes - Total number of governance nodes.
 * @param {number} quorumPercentage - Required quorum percentage (default is 67%).
 * @returns {number} - Number of nodes required to meet the quorum.
 */
function calculateQuorum(totalNodes, quorumPercentage = 67) {
    return Math.ceil((totalNodes * quorumPercentage) / 100);
}

module.exports = {
    getGovernanceNodes,
    validateSignatures,
    calculateQuorum,
};

// ------------------------------------------------------------------------------
// End of Module: Governance Utilities
// Version: 1.0.0 | Updated: 2024-12-03
// ------------------------------------------------------------------------------

