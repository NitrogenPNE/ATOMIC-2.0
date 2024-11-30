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
// and real-time carbon data. Incorporates eco-rebates.
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
const nodeConfigPath = path.resolve(__dirname, "../Config/nodeConfig.json");

// Constants
const DEFAULT_CARBON_PRICE = 65.00; // CAD per kg CO₂
const DEFAULT_NODE_EMISSION = 150.0; // g CO₂ per node per bounce
const REBATE_MULTIPLIER = 0.15; // Eco-rebate multiplier for emission savings

/**
 * Calculates token pricing based on node emissions and carbon pricing.
 * @returns {Object} - Calculated pricing details.
 */
async function calculatePricing() {
    try {
        console.log("Loading carbon pricing and node configurations...");
        const carbonPricing = await fs.readJson(carbonPricingPath);
        const nodeConfig = await fs.readJson(nodeConfigPath);

        // Extract values
        const carbonPricePerKg = carbonPricing.currentPrice || DEFAULT_CARBON_PRICE;
        const nodeEmission = nodeConfig.emissionPerNode || DEFAULT_NODE_EMISSION;
        const nodeCount = nodeConfig.nodeCount || 1;

        // Calculate base price per node
        const baseNodePrice = (nodeEmission / 1000) * carbonPricePerKg;

        // Apply rebates based on eco-friendly operations
        const rebatePerNode = baseNodePrice * REBATE_MULTIPLIER;
        const effectiveNodePrice = baseNodePrice - rebatePerNode;

        // Calculate total carbon cost for all nodes
        const totalCost = effectiveNodePrice * nodeCount;

        return {
            carbonPricePerKg,
            nodeEmission,
            baseNodePrice: baseNodePrice.toFixed(2),
            rebatePerNode: rebatePerNode.toFixed(2),
            effectiveNodePrice: effectiveNodePrice.toFixed(2),
            totalCost: totalCost.toFixed(2),
            nodeCount,
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