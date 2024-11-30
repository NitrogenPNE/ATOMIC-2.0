"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: HQ Node Registration
//
// Description:
// Handles the registration process for HQ nodes in the ATOMIC network. Verifies
// the required details, assigns node addresses, and updates the node registry.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations.
// - uuid: For generating unique identifiers.
// - nodeRegistry.json: Stores registered HQ nodes.
// - logger: Tracks registration activity.
//
// Usage:
// const { registerHQNode } = require('./registerHQNode');
// registerHQNode(nodeDetails).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { logInfo, logError } = require("../Analytics/analyticsEngine");

// Paths
const NODE_REGISTRY_PATH = path.resolve(__dirname, "../Config/nodeRegistry.json");

/**
 * Registers a new HQ node in the system.
 * @param {Object} nodeDetails - Details of the node to register.
 * @param {string} nodeDetails.organizationName - Name of the organization.
 * @param {string} nodeDetails.type - Type of HQ node ("Corporate" or "National Defense").
 * @param {string} nodeDetails.branch - Branch of the organization (if applicable).
 * @param {string} nodeDetails.department - Department associated with the node.
 * @returns {Promise<Object>} - Registration details including node address.
 */
async function registerHQNode(nodeDetails) {
    try {
        // Validate input
        validateNodeDetails(nodeDetails);

        // Load or initialize the node registry
        const nodeRegistry = await loadNodeRegistry();

        // Generate a unique node address
        const nodeId = uuidv4();
        const nodeAddress = `HQ-${nodeDetails.type}-${nodeId}`;

        // Create a node entry
        const nodeEntry = {
            nodeId,
            nodeAddress,
            organizationName: nodeDetails.organizationName,
            type: nodeDetails.type,
            branch: nodeDetails.branch || "N/A",
            department: nodeDetails.department || "N/A",
            registeredAt: new Date().toISOString(),
        };

        // Add the node to the registry
        nodeRegistry.nodes.push(nodeEntry);
        await saveNodeRegistry(nodeRegistry);

        logInfo(`HQ Node registered successfully: ${nodeAddress}`);
        return nodeEntry;
    } catch (error) {
        logError(`Error registering HQ Node: ${error.message}`);
        throw error;
    }
}

/**
 * Validates the details of the node to be registered.
 * @param {Object} nodeDetails - Details of the node to validate.
 * @throws {Error} - If validation fails.
 */
function validateNodeDetails(nodeDetails) {
    const requiredFields = ["organizationName", "type"];
    requiredFields.forEach((field) => {
        if (!nodeDetails[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    });

    if (!["Corporate", "National Defense"].includes(nodeDetails.type)) {
        throw new Error(`Invalid node type: ${nodeDetails.type}. Must be "Corporate" or "National Defense".`);
    }
}

/**
 * Loads the node registry from the file system.
 * @returns {Promise<Object>} - The node registry object.
 */
async function loadNodeRegistry() {
    try {
        if (await fs.pathExists(NODE_REGISTRY_PATH)) {
            return await fs.readJson(NODE_REGISTRY_PATH);
        }
        // Initialize a new registry if none exists
        return { nodes: [] };
    } catch (error) {
        throw new Error(`Failed to load node registry: ${error.message}`);
    }
}

/**
 * Saves the node registry to the file system.
 * @param {Object} registry - The registry object to save.
 * @returns {Promise<void>}
 */
async function saveNodeRegistry(registry) {
    try {
        await fs.writeJson(NODE_REGISTRY_PATH, registry, { spaces: 2 });
    } catch (error) {
        throw new Error(`Failed to save node registry: ${error.message}`);
    }
}

module.exports = {
    registerHQNode,
};

// ------------------------------------------------------------------------------
// End of Module: HQ Node Registration
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for HQ Node registration.
// ------------------------------------------------------------------------------