"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: HQ Credentials Validator
//
// Description:
// Validates credentials for HQ node registration or login. Ensures security
// through hash-based password verification and access control checks.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - bcrypt: For secure password hashing and comparison.
// - fs-extra: For reading stored credentials.
// - nodeRegistry.json: Stores registered HQ node credentials.
//
// Usage:
// const { validateCredentials } = require('./validateHQCredentials');
// validateCredentials({ nodeId, password }).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const bcrypt = require("bcrypt");
const fs = require("fs-extra");
const path = require("path");

// Paths
const NODE_REGISTRY_PATH = path.resolve(__dirname, "../Config/nodeRegistry.json");

/**
 * Validates HQ node credentials during registration or login.
 * @param {Object} credentials - Credentials to validate.
 * @param {string} credentials.nodeId - Node ID to validate.
 * @param {string} credentials.password - Password to validate.
 * @returns {Promise<boolean>} - True if credentials are valid.
 */
async function validateCredentials({ nodeId, password }) {
    try {
        // Load node registry
        const nodeRegistry = await loadNodeRegistry();

        // Find the node entry by ID
        const nodeEntry = nodeRegistry.nodes.find((node) => node.nodeId === nodeId);
        if (!nodeEntry) {
            throw new Error(`Node ID not found: ${nodeId}`);
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, nodeEntry.passwordHash);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials: Password verification failed.");
        }

        console.log(`Credentials validated successfully for Node ID: ${nodeId}`);
        return true;
    } catch (error) {
        console.error(`Error validating credentials: ${error.message}`);
        throw error;
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
        throw new Error("Node registry not found.");
    } catch (error) {
        throw new Error(`Failed to load node registry: ${error.message}`);
    }
}

module.exports = {
    validateCredentials,
};

// ------------------------------------------------------------------------------
// End of Module: HQ Credentials Validator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for HQ credentials validation.
// ------------------------------------------------------------------------------