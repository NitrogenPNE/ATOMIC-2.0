"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Node Manager (With Multi-Signature Governance)
 *
 * Description:
 * Integrates quorum-based multi-signature governance checks for critical
 * actions like node registration, role assignment, and deletion.
 *
 * Author: GOVMintHQNode Integration Team
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const winston = require("winston");
const {
    registerNode,
    removeNode,
    assignNodeRole,
    validateSignatures,
    loadGovernanceNodes,
} = require("../Governance/nodeManagerWithGovernance");

// Configuration Paths
const NODE_CONFIG_PATH = path.resolve(__dirname, "../Config/NodeRegistry.json");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "node-manager.log" }),
        new winston.transports.Console(),
    ],
});

// Default Node Registry
const DEFAULT_NODE_REGISTRY = {
    nodes: [],
};

/**
 * Load the current node registry.
 * @returns {Object} - Node registry object.
 */
function loadNodeRegistry() {
    try {
        if (!fs.existsSync(NODE_CONFIG_PATH)) {
            logger.info("Node registry not found. Initializing new registry.");
            fs.writeJsonSync(NODE_CONFIG_PATH, DEFAULT_NODE_REGISTRY, { spaces: 4 });
        }
        return fs.readJsonSync(NODE_CONFIG_PATH);
    } catch (error) {
        logger.error("Failed to load node registry:", error.message);
        throw new Error("Node registry loading error.");
    }
}

/**
 * Save the updated node registry.
 * @param {Object} registry - Node registry object.
 */
function saveNodeRegistry(registry) {
    try {
        fs.writeJsonSync(NODE_CONFIG_PATH, registry, { spaces: 4 });
        logger.info("Node registry updated successfully.");
    } catch (error) {
        logger.error("Failed to save node registry:", error.message);
        throw new Error("Node registry saving error.");
    }
}

/**
 * Registers a node with multi-signature governance approval.
 * @param {string} nodeId - Node identifier.
 * @param {string} type - Node type.
 * @param {Array<string>} roles - Assigned roles for the node.
 * @param {Array<{nodeId: string, signature: string}>} signatures - Governance node signatures.
 * @returns {Promise<void>}
 */
async function registerNodeWithGovernance(nodeId, type, roles, signatures) {
    try {
        const actionHash = crypto.createHash("sha256").update(JSON.stringify({ nodeId, type, roles })).digest("hex");
        const isApproved = await validateSignatures(signatures, actionHash);

        if (!isApproved) {
            throw new Error("Governance approval failed. Node registration aborted.");
        }

        await registerNode(nodeId, { type, roles });
        logger.info(`Node ${nodeId} registered with governance.`);
    } catch (error) {
        logger.error(`Failed to register node ${nodeId} with governance: ${error.message}`);
        throw error;
    }
}

/**
 * Deletes a node with multi-signature governance approval.
 * @param {string} nodeId - Node identifier.
 * @param {Array<{nodeId: string, signature: string}>} signatures - Governance node signatures.
 * @returns {Promise<void>}
 */
async function deleteNodeWithGovernance(nodeId, signatures) {
    try {
        const actionHash = crypto.createHash("sha256").update(JSON.stringify({ nodeId, action: "delete" })).digest("hex");
        const isApproved = await validateSignatures(signatures, actionHash);

        if (!isApproved) {
            throw new Error("Governance approval failed. Node deletion aborted.");
        }

        await removeNode(nodeId);
        logger.info(`Node ${nodeId} deleted with governance.`);
    } catch (error) {
        logger.error(`Failed to delete node ${nodeId} with governance: ${error.message}`);
        throw error;
    }
}

/**
 * Assign a role to a node with governance approval.
 * @param {string} nodeId - Node identifier.
 * @param {string} newRole - New role for the node.
 * @param {Array<{nodeId: string, signature: string}>} signatures - Governance node signatures.
 * @returns {Promise<void>}
 */
async function assignNodeRoleWithGovernance(nodeId, newRole, signatures) {
    try {
        const actionHash = crypto.createHash("sha256").update(JSON.stringify({ nodeId, newRole })).digest("hex");
        const isApproved = await validateSignatures(signatures, actionHash);

        if (!isApproved) {
            throw new Error("Governance approval failed. Role assignment aborted.");
        }

        assignNodeRole(nodeId, newRole);
        logger.info(`Role for node ${nodeId} updated to ${newRole} with governance.`);
    } catch (error) {
        logger.error(`Failed to assign role for node ${nodeId} with governance: ${error.message}`);
        throw error;
    }
}

/**
 * List all nodes.
 * @returns {Array<Object>} - List of registered nodes.
 */
function listNodes() {
    return loadNodeRegistry().nodes;
}

module.exports = {
    registerNodeWithGovernance,
    deleteNodeWithGovernance,
    assignNodeRoleWithGovernance,
    listNodes,
};

// ------------------------------------------------------------------------------