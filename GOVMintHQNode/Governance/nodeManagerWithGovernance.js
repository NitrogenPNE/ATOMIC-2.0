"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Governance Node Manager
 *
 * Description:
 * Manages quorum-based governance actions, including signature validation
 * and interaction with governance nodes for distributed authority.
 *
 * Author: Governance Integration Team
 * ------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

// Configuration Paths
const GOVERNANCE_NODES_CONFIG_PATH = path.resolve(__dirname, "../Config/governanceNodes.json");

// Default governance nodes structure
const DEFAULT_GOVERNANCE_NODES = {
    nodes: []
};

/**
 * Loads governance nodes from configuration.
 * @returns {Object} - Governance nodes configuration.
 */
function loadGovernanceNodes() {
    try {
        if (!fs.existsSync(GOVERNANCE_NODES_CONFIG_PATH)) {
            console.info("Governance nodes configuration not found. Initializing default structure.");
            fs.writeJsonSync(GOVERNANCE_NODES_CONFIG_PATH, DEFAULT_GOVERNANCE_NODES, { spaces: 4 });
        }
        return fs.readJsonSync(GOVERNANCE_NODES_CONFIG_PATH);
    } catch (error) {
        console.error("Failed to load governance nodes configuration:", error.message);
        throw new Error("Governance nodes configuration loading error.");
    }
}

/**
 * Retrieves the public key for a governance node.
 * @param {string} nodeId - The ID of the governance node.
 * @returns {string|null} - Public key of the node or null if not found.
 */
function getPublicKeyForNode(nodeId) {
    const governanceNodes = loadGovernanceNodes();
    const node = governanceNodes.nodes.find(node => node.nodeId === nodeId);
    return node ? node.publicKey : null;
}

/**
 * Validates signatures from governance nodes.
 * @param {Array<{nodeId: string, signature: string}>} signatures - Signatures to validate.
 * @param {string} actionHash - Hash of the action to validate against.
 * @returns {Promise<boolean>} - True if quorum is met, false otherwise.
 */
async function validateSignatures(signatures, actionHash) {
    try {
        const governanceNodes = loadGovernanceNodes();
        const requiredQuorum = Math.ceil(governanceNodes.nodes.length / 2); // Majority quorum

        let validSignatures = 0;

        for (const { nodeId, signature } of signatures) {
            const publicKey = getPublicKeyForNode(nodeId);
            if (!publicKey) {
                console.warn(`Public key for node ${nodeId} not found. Skipping validation.`);
                continue;
            }

            const isValid = crypto.verify(
                "sha256",
                Buffer.from(actionHash, "hex"),
                { key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
                Buffer.from(signature, "hex")
            );

            if (isValid) {
                validSignatures += 1;
            }

            if (validSignatures >= requiredQuorum) {
                console.info("Quorum met. Signatures validated.");
                return true;
            }
        }

        console.warn("Quorum not met. Action validation failed.");
        return false;
    } catch (error) {
        console.error("Signature validation error:", error.message);
        throw error;
    }
}

/**
 * Registers a new governance node.
 * @param {string} nodeId - The ID of the governance node.
 * @param {string} publicKey - The public key of the node.
 * @returns {void}
 */
function registerGovernanceNode(nodeId, publicKey) {
    try {
        const governanceNodes = loadGovernanceNodes();
        if (governanceNodes.nodes.find(node => node.nodeId === nodeId)) {
            throw new Error(`Node ${nodeId} is already registered as a governance node.`);
        }

        governanceNodes.nodes.push({ nodeId, publicKey });
        fs.writeJsonSync(GOVERNANCE_NODES_CONFIG_PATH, governanceNodes, { spaces: 4 });
        console.info(`Governance node ${nodeId} registered successfully.`);
    } catch (error) {
        console.error(`Failed to register governance node ${nodeId}:`, error.message);
        throw error;
    }
}

/**
 * Removes a governance node.
 * @param {string} nodeId - The ID of the governance node to remove.
 * @returns {void}
 */
function removeGovernanceNode(nodeId) {
    try {
        const governanceNodes = loadGovernanceNodes();
        const nodeIndex = governanceNodes.nodes.findIndex(node => node.nodeId === nodeId);

        if (nodeIndex === -1) {
            throw new Error(`Governance node ${nodeId} not found.`);
        }

        governanceNodes.nodes.splice(nodeIndex, 1);
        fs.writeJsonSync(GOVERNANCE_NODES_CONFIG_PATH, governanceNodes, { spaces: 4 });
        console.info(`Governance node ${nodeId} removed successfully.`);
    } catch (error) {
        console.error(`Failed to remove governance node ${nodeId}:`, error.message);
        throw error;
    }
}

module.exports = {
    loadGovernanceNodes,
    getPublicKeyForNode,
    validateSignatures,
    registerGovernanceNode,
    removeGovernanceNode,
};
