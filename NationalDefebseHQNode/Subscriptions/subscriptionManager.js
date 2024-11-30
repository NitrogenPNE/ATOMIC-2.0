"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Subscription Manager
//
// Description:
// Manages subscriptions for National Defense HQNode. Includes node registration, 
// annual subscription pricing based on node requirements, and shard allocation.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file and ledger management.
// - path: For resolving subscription ledger paths.
// - addressIssuer: For issuing cryptographic addresses to nodes.
// - shardAllocator: For allocating shards based on node subscription.
// - pricingRules.json: Defines pricing tiers for node requirements.
//
// Usage:
// const { registerNode, renewSubscription, calculatePrice } = require('./subscriptionManager');
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { issueAddress } = require("./addressIssuer");
const shardAllocator = require("./shardAllocator");

// Paths
const SUBSCRIPTION_LEDGER = path.resolve(__dirname, "./subscriptionLedger.json");
const PRICING_RULES = path.resolve(__dirname, "./subscriptionRules.json");

/**
 * Registers a new node in the subscription ledger.
 * @param {string} nodeId - Unique identifier for the node.
 * @param {number} nodeCount - Number of nodes to be supported.
 * @param {string} department - Department the node belongs to.
 * @returns {Promise<Object>} - Registration details including address, cost, and status.
 */
async function registerNode(nodeId, nodeCount, department) {
    console.log(`Registering node: ${nodeId}, Node Count: ${nodeCount}, Department: ${department}`);

    try {
        if (!nodeId || !nodeCount || !department) {
            throw new Error("Node ID, node count, and department are required.");
        }

        // Load pricing rules
        const pricingRules = await loadPricingRules();
        const price = calculatePrice(nodeCount, pricingRules);

        if (price === null) {
            throw new Error(`Invalid node count: ${nodeCount}. No matching pricing tier.`);
        }

        // Issue a unique cryptographic address
        const address = await issueAddress(nodeId, department);

        // Load subscription ledger
        let ledger = await loadSubscriptionLedger();

        // Check if the node is already registered
        if (ledger.subscriptions.has(nodeId)) {
            throw new Error(`Node ${nodeId} is already registered.`);
        }

        // Create subscription entry
        const newSubscription = {
            nodeId,
            nodeCount,
            department,
            address,
            subscriptionId: `sub-${Date.now()}`,
            annualCost: price,
            status: "active",
            createdAt: new Date().toISOString(),
            expiresAt: calculateExpirationDate(),
        };

        // Add subscription and save ledger
        ledger.subscriptions.set(nodeId, newSubscription);
        await saveSubscriptionLedger(ledger);

        // Allocate shards based on node count
        const allocatedShards = await shardAllocator.allocateShards(newSubscription);
        newSubscription.allocatedShards = allocatedShards;

        console.log(`Node ${nodeId} registered successfully with annual cost: $${price}`);
        return newSubscription;
    } catch (error) {
        console.error(`Failed to register node: ${error.message}`);
        throw error;
    }
}

/**
 * Calculates the annual price for a subscription based on node requirements.
 * @param {number} nodeCount - Number of nodes in the subscription.
 * @param {Array<Object>} pricingRules - Pricing rules loaded from a JSON file.
 * @returns {number|null} - Calculated price or null if no matching tier.
 */
function calculatePrice(nodeCount, pricingRules) {
    const tier = pricingRules.find((rule) => nodeCount >= rule.minNodes && nodeCount <= rule.maxNodes);
    return tier ? tier.pricePerYear : null;
}

/**
 * Renews an existing subscription by extending its expiration date.
 * @param {string} nodeId - Node ID of the subscription to renew.
 * @returns {Promise<Object>} - Updated subscription details.
 */
async function renewSubscription(nodeId) {
    console.log(`Renewing subscription for node: ${nodeId}`);

    try {
        // Load subscription ledger
        let ledger = await loadSubscriptionLedger();

        // Find the subscription
        const subscription = ledger.subscriptions.get(nodeId);

        if (!subscription) {
            throw new Error(`No subscription found for node: ${nodeId}`);
        }

        // Extend the expiration date
        subscription.expiresAt = calculateExpirationDate();
        await saveSubscriptionLedger(ledger);

        console.log(`Subscription for node ${nodeId} renewed successfully.`);
        return subscription;
    } catch (error) {
        console.error(`Failed to renew subscription: ${error.message}`);
        throw error;
    }
}

/**
 * Retrieves all active subscriptions.
 * @returns {Promise<Array>} - List of active subscriptions.
 */
async function getActiveSubscriptions() {
    try {
        const ledger = await loadSubscriptionLedger();
        const activeSubscriptions = Array.from(ledger.subscriptions.values()).filter((sub) => sub.status === "active");
        console.log(`Retrieved ${activeSubscriptions.length} active subscriptions.`);
        return activeSubscriptions;
    } catch (error) {
        console.error("Failed to retrieve active subscriptions:", error.message);
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
            const ledger = await fs.readJson(SUBSCRIPTION_LEDGER);
            ledger.subscriptions = new Map(ledger.subscriptions.map((sub) => [sub.nodeId, sub]));
            return ledger;
        }
        return { subscriptions: new Map() }; // Initialize if ledger doesn't exist
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
        const serializedLedger = { subscriptions: Array.from(ledger.subscriptions.values()) };
        await fs.writeJson(SUBSCRIPTION_LEDGER, serializedLedger, { spaces: 2 });
    } catch (error) {
        console.error("Failed to save subscription ledger:", error.message);
        throw error;
    }
}

/**
 * Calculates the expiration date for a subscription (1 year from now).
 * @returns {string} - Expiration date in ISO format.
 */
function calculateExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    return expirationDate.toISOString();
}

/**
 * Loads pricing rules from a JSON file.
 * @returns {Promise<Array<Object>>} - Pricing rules.
 */
async function loadPricingRules() {
    try {
        if (await fs.pathExists(PRICING_RULES)) {
            return await fs.readJson(PRICING_RULES);
        }
        throw new Error("Pricing rules not found.");
    } catch (error) {
        console.error("Failed to load pricing rules:", error.message);
        throw error;
    }
}

module.exports = {
    registerNode,
    renewSubscription,
    calculatePrice,
    getActiveSubscriptions,
};