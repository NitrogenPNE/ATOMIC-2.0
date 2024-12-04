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

// Default market metrics
const DEFAULT_MARKET_METRICS = {
    marketDemand: 1,
    demandMultiplier: 0.1,
    carbonFootprintMultiplier: 1.0,
};

/**
 * Calculate token price dynamically based on node costs and market metrics.
 * @returns {Object} - Token pricing details including dynamic adjustments.
 */
async function calculateTokenPrice() {
    try {
        // Load base pricing from carbon pricing calculator
        const { effectiveNodePrice, tokenPrice: baseTokenPrice } = await calculatePricing();

        // Load market metrics with fallback to defaults
        const marketMetrics = (await fs.pathExists(marketMetricsPath))
            ? await fs.readJson(marketMetricsPath)
            : DEFAULT_MARKET_METRICS;

        const marketDemand = marketMetrics.marketDemand ?? DEFAULT_MARKET_METRICS.marketDemand;
        const demandMultiplier = marketMetrics.demandMultiplier ?? DEFAULT_MARKET_METRICS.demandMultiplier;
        const carbonFootprintMultiplier =
            marketMetrics.carbonFootprintMultiplier ?? DEFAULT_MARKET_METRICS.carbonFootprintMultiplier;

        // Ensure valid metric ranges
        if (typeof marketDemand !== "number" || marketDemand < 0) {
            throw new Error("Invalid marketDemand value.");
        }
        if (typeof demandMultiplier !== "number" || demandMultiplier < 0) {
            throw new Error("Invalid demandMultiplier value.");
        }
        if (typeof carbonFootprintMultiplier !== "number" || carbonFootprintMultiplier <= 0) {
            throw new Error("Invalid carbonFootprintMultiplier value.");
        }

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

        // Load existing token metadata with validation
        const tokenMetadata = (await fs.pathExists(tokenMetadataPath))
            ? await fs.readJson(tokenMetadataPath)
            : { currentTokenPrice: 0, lastUpdated: null };

        if (typeof tokenMetadata !== "object" || !tokenMetadata) {
            throw new Error("Invalid token metadata format.");
        }

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