"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Subscription Manager
//
// Description:
// Manages subscriptions for Corporate and National Defense nodes. Handles 
// subscription creation, renewal, cancellation, and pricing based on node 
// requirements and corporate size.
//
// Dependencies:
// - fs-extra: File operations for managing the subscription ledger.
// - path: Handles paths to subscription data.
// - crypto: Generates unique addresses for nodes.
// - connectionManager: Manages active connections and addresses.
// - blockchainLogger: Logs subscription events to the blockchain ledger.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const blockchainLogger = require("./blockchainLogger");
const { addConnection, removeConnection } = require("./connectionManager");

// Paths
const subscriptionLedgerPath = path.resolve(__dirname, "subscriptionLedger.json");

// Pricing Configuration
const pricingTable = {
    "small": 100,    // Small corporate node
    "medium": 500,   // Medium corporate node
    "large": 1000,   // Large corporate node
    "defense": 0     // National defense nodes (no cost)
};

/**
 * Generates a unique address for a new subscription.
 * @returns {string} - Generated address.
 */
function generateAddress() {
    return crypto.randomBytes(16).toString("hex");
}

/**
 * Creates a new subscription for a node.
 * @param {string} nodeId - Unique identifier for the node.
 * @param {string} type - Type of node (e.g., "Corporate", "NationalDefense").
 * @param {string} size - Size of the node ("small", "medium", "large").
 * @returns {Promise<Object>} - Subscription details.
 */
async function createSubscription(nodeId, type, size) {
    try {
        console.log(`Creating subscription for nodeId: ${nodeId}, type: ${type}, size: ${size}`);

        // Validate input
        if (!["small", "medium", "large", "defense"].includes(size)) {
            throw new Error(`Invalid size: ${size}. Must be one of 'small', 'medium', 'large', or 'defense'.`);
        }
        if (!["Corporate", "NationalDefense"].includes(type)) {
            throw new Error(`Invalid type: ${type}. Must be 'Corporate' or 'NationalDefense'.`);
        }

        const address = generateAddress();
        const price = pricingTable[size];
        const timestamp = new Date().toISOString();

        const subscription = {
            nodeId,
            type,
            size,
            address,
            subscribedAt: timestamp,
            lastRenewed: timestamp,
            status: "active",
            price
        };

        // Save subscription to ledger
        const ledger = await loadSubscriptionLedger();
        ledger.subscriptions.push(subscription);
        await saveSubscriptionLedger(ledger);

        // Add connection to the network
        await addConnection(nodeId, address);

        // Log to blockchain
        await blockchainLogger.logEvent("SubscriptionCreated", subscription);

        console.log(`Subscription created successfully for nodeId: ${nodeId}`);
        return subscription;
    } catch (error) {
        console.error(`Failed to create subscription: ${error.message}`);
        throw error;
    }
}

/**
 * Renews an existing subscription.
 * @param {string} nodeId - Node identifier.
 * @returns {Promise<Object>} - Updated subscription details.
 */
async function renewSubscription(nodeId) {
    try {
        console.log(`Renewing subscription for nodeId: ${nodeId}`);

        const ledger = await loadSubscriptionLedger();
        const subscription = ledger.subscriptions.find((sub) => sub.nodeId === nodeId);

        if (!subscription) {
            throw new Error(`Subscription not found for nodeId: ${nodeId}`);
        }

        if (subscription.status !== "active") {
            throw new Error(`Subscription for nodeId ${nodeId} is not active.`);
        }

        subscription.lastRenewed = new Date().toISOString();
        await saveSubscriptionLedger(ledger);

        // Log renewal to blockchain
        await blockchainLogger.logEvent("SubscriptionRenewed", { nodeId, lastRenewed: subscription.lastRenewed });

        console.log(`Subscription renewed successfully for nodeId: ${nodeId}`);
        return subscription;
    } catch (error) {
        console.error(`Failed to renew subscription: ${error.message}`);
        throw error;
    }
}

/**
 * Cancels a subscription.
 * @param {string} nodeId - Node identifier.
 * @returns {Promise<void>}
 */
async function cancelSubscription(nodeId) {
    try {
        console.log(`Cancelling subscription for nodeId: ${nodeId}`);

        const ledger = await loadSubscriptionLedger();
        const subscriptionIndex = ledger.subscriptions.findIndex((sub) => sub.nodeId === nodeId);

        if (subscriptionIndex === -1) {
            throw new Error(`Subscription not found for nodeId: ${nodeId}`);
        }

        // Remove subscription from ledger
        const subscription = ledger.subscriptions.splice(subscriptionIndex, 1)[0];
        subscription.status = "cancelled";

        await saveSubscriptionLedger(ledger);

        // Remove connection from the network
        await removeConnection(nodeId);

        // Log cancellation to blockchain
        await blockchainLogger.logEvent("SubscriptionCancelled", { nodeId, address: subscription.address });

        console.log(`Subscription cancelled successfully for nodeId: ${nodeId}`);
    } catch (error) {
        console.error(`Failed to cancel subscription: ${error.message}`);
        throw error;
    }
}

/**
 * Loads the subscription ledger from disk.
 * @returns {Promise<Object>} - Subscription ledger data.
 */
async function loadSubscriptionLedger() {
    if (!(await fs.pathExists(subscriptionLedgerPath))) {
        return { subscriptions: [] };
    }
    return fs.readJson(subscriptionLedgerPath);
}

/**
 * Saves the subscription ledger to disk.
 * @param {Object} ledger - Subscription ledger data.
 */
async function saveSubscriptionLedger(ledger) {
    await fs.writeJson(subscriptionLedgerPath, ledger, { spaces: 2 });
}

module.exports = {
    createSubscription,
    renewSubscription,
    cancelSubscription
};