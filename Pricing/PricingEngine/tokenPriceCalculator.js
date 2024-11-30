"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Price Calculator
//
// Description:
// Calculates token prices dynamically based on node costs, carbon pricing,
// and market demand. Incorporates AI-driven optimizations for price adjustments.
//
// Dependencies:
// - carbonPricingCalculator.js: Calculates base node prices.
// - fs-extra: File system operations for managing token metadata.
// - path: For handling file paths.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { calculatePricing } = require("./carbonPricingCalculator");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const marketMetricsPath = path.resolve(__dirname, "../Config/marketMetricsConfig.json");

/**
 * Calculate token price dynamically based on node costs and market metrics.
 * @returns {Object} - Token pricing details including dynamic adjustments.
 */
async function calculateTokenPrice() {
    try {
        // Load base pricing from carbon pricing calculator
        const { effectiveNodePrice, tokenPrice: baseTokenPrice } = await calculatePricing();

        // Load market metrics
        const marketMetrics = await fs.readJson(marketMetricsPath);

        const { marketDemand, demandMultiplier, carbonFootprintMultiplier } = marketMetrics;

        // Calculate adjusted token price
        const adjustedTokenPrice =
            baseTokenPrice * (1 + marketDemand * demandMultiplier) * carbonFootprintMultiplier;

        return {
            baseTokenPrice: parseFloat(baseTokenPrice).toFixed(6),
            adjustedTokenPrice: parseFloat(adjustedTokenPrice).toFixed(6),
            effectiveNodePrice: parseFloat(effectiveNodePrice).toFixed(2),
            marketDemand,
            demandMultiplier,
            carbonFootprintMultiplier,
        };
    } catch (error) {
        console.error("Error calculating token price:", error.message);
        throw error;
    }
}

/**
 * Updates token metadata with the calculated token price.
 * @returns {Object} - Updated token metadata details.
 */
async function updateTokenMetadata() {
    try {
        console.log("Calculating token price...");
        const pricingDetails = await calculateTokenPrice();

        // Load existing token metadata
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        // Update token price and metadata
        tokenMetadata.currentTokenPrice = pricingDetails.adjustedTokenPrice;
        tokenMetadata.lastUpdated = new Date().toISOString();

        // Save updated metadata
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Token metadata updated successfully.");
        return pricingDetails;
    } catch (error) {
        console.error("Error updating token metadata:", error.message);
        throw error;
    }
}

// Execute token price update if called directly
if (require.main === module) {
    updateTokenMetadata()
        .then((details) => {
            console.log("Token Pricing Details:", details);
        })
        .catch((error) => {
            console.error("Critical error during token price update:", error.message);
        });
}

module.exports = { calculateTokenPrice, updateTokenMetadata };