"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Address Issuer
//
// Description:
// Issues unique cryptographic addresses for nodes and systems within the
// National Defense HQNode network. Addresses are securely generated and
// linked to subscription details in the subscription ledger.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For cryptographic address generation.
// - fs-extra: For file operations and ledger updates.
// - path: For resolving subscription ledger paths.
//
// Usage:
// const { issueAddress } = require('./addressIssuer');
// issueAddress("ND-Node1", "Validation").then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

// File paths
const SUBSCRIPTION_LEDGER = path.resolve(__dirname, "./subscriptionLedger.json");

/**
 * Issues a unique cryptographic address for a node and updates the subscription ledger.
 * @param {string} nodeId - The unique identifier for the node.
 * @param {string} department - The department to which the node belongs.
 * @returns {Promise<string>} - The issued cryptographic address.
 */
async function issueAddress(nodeId, department) {
    try {
        console.log(`Issuing address for node: ${nodeId}, department: ${department}`);

        // Validate input
        if (!nodeId || !department) {
            throw new Error("Node ID and department are required.");
        }

        // Generate a unique cryptographic address
        const address = crypto.createHash("sha256").update(`${nodeId}-${Date.now()}`).digest("hex");

        // Load the subscription ledger
        let ledger = await loadSubscriptionLedger();

        // Create a subscription entry
        const newSubscription = {
            branch: "NationalDefense",
            department,
            nodeId,
            subscriptionId: `sub-${Date.now()}`,
            address,
            status: "active",
            issuedAt: new Date().toISOString(),
            expiresAt: calculateExpirationDate(),
            assignedShards: [],
        };

        // Add to ledger and save
        ledger.subscriptions.push(newSubscription);
        await saveSubscriptionLedger(ledger);

        console.log(`Address issued: ${address}`);
        return address;
    } catch (error) {
        console.error(`Error issuing address: ${error.message}`);
        throw error;
    }
}

/**
 * Loads the subscription ledger from the file system.
 * @returns {Promise<Object>} - The loaded subscription ledger.
 */
async function loadSubscriptionLedger() {
    try {
        if (await fs.pathExists(SUBSCRIPTION_LEDGER)) {
            return await fs.readJson(SUBSCRIPTION_LEDGER);
        }
        return { subscriptions: [] }; // Initialize a new ledger if it doesn't exist
    } catch (error) {
        console.error("Failed to load subscription ledger:", error.message);
        throw error;
    }
}

/**
 * Saves the subscription ledger to the file system.
 * @param {Object} ledger - The subscription ledger to save.
 */
async function saveSubscriptionLedger(ledger) {
    try {
        await fs.writeJson(SUBSCRIPTION_LEDGER, ledger, { spaces: 2 });
        console.log("Subscription ledger updated successfully.");
    } catch (error) {
        console.error("Failed to save subscription ledger:", error.message);
        throw error;
    }
}

/**
 * Calculates the expiration date for a subscription (default: 1 year from now).
 * @returns {string} - The expiration date in ISO format.
 */
function calculateExpirationDate() {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1); // Add 1 year
    return now.toISOString();
}

module.exports = {
    issueAddress,
};

// ------------------------------------------------------------------------------
// End of Module: Address Issuer
// Version: 1.0.0 | Updated: 2024-11-24
// ------------------------------------------------------------------------------ 
