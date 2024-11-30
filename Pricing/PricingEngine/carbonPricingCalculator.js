"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Carbon Pricing Calculator
//
// Description:
// Calculates token pricing based on carbon pricing, node-level emissions,
// and real-time carbon data. Incorporates eco-rebates and dynamic adjustments.
//
// Dependencies:
// - fs-extra: For file read/write operations.
// - path: For file path management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Config paths
const carbonPricingPath = path.resolve(__dirname, "../Data/carbonPricing.json");
const nodeConfigPath = path.resolve(__dirname, "../Config/shardConfig.json");

// Constants
const DEFAULT_CARBON_PRICE = 65.00; // CAD per kg CO₂
const DEFAULT_NODE_EMISSION = 150.0; // g CO₂ per node per bounce
const TOKENS_PER_NODE = 1; // 1 token per node

/**
 * Calculates token pricing based on node emissions, carbon pricing, and eco-rebates.
 * @returns {Object} - Calculated pricing details.
 */
async function calculatePricing() {
    try {
        // Load carbon pricing and node configuration
        const carbonPricing = await fs.readJson(carbonPricingPath);
        const nodeConfig = await fs.readJson(nodeConfigPath);

        // Extract values
        const carbonPricePerKg = carbonPricing.currentPrice || DEFAULT_CARBON_PRICE;
        const nodeEmission = nodeConfig.emissionPerNode || DEFAULT_NODE_EMISSION;
        const rebatePerNode = nodeConfig.rebatePerNode || 0; // CAD (if any)

        // Calculate base price per node (node-level emissions)
        const baseNodePrice = (nodeEmission / 1000) * carbonPricePerKg;

        // Apply rebates (deduct eco-rebate per node, if applicable)
        const effectiveNodePrice = Math.max(0, baseNodePrice - rebatePerNode);

        // Calculate token price (1 token per node)
        const tokenPrice = effectiveNodePrice / TOKENS_PER_NODE;

        // Return pricing details
        return {
            baseNodePrice: baseNodePrice.toFixed(2),
            effectiveNodePrice: effectiveNodePrice.toFixed(2),
            tokenPrice: tokenPrice.toFixed(2),
            carbonPricePerKg,
            nodeEmission,
            rebatePerNode,
        };
    } catch (error) {
        console.error("Error calculating carbon-based pricing:", error.message);
        throw error;
    }
}

/**
 * Executes pricing calculations and logs the results.
 */
async function executePricing() {
    try {
        console.log("Calculating carbon-based pricing...");
        const pricingDetails = await calculatePricing();
        console.log("Pricing Details:", pricingDetails);
    } catch (error) {
        console.error("Failed to execute carbon pricing calculations:", error.message);
    }
}

// Run the calculator if called directly
if (require.main === module) {
    executePricing();
}

module.exports = { calculatePricing };