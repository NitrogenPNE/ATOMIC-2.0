"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Share Price Adjuster
//
// Description:
// Dynamically adjusts share prices based on token demand, node count, carbon
// pricing, and market metrics. Ensures fair valuation of shares while maintaining
// alignment with ATOMIC's strategic goals.
//
// Dependencies:
// - carbonPricingCalculator.js: For real-time carbon-based pricing.
// - tokenPriceCalculator.js: For dynamic token pricing adjustments.
// - fs-extra: For configuration file management.
// - path: For file path handling.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { calculateTokenPrice } = require("../PricingEngine/tokenPriceCalculator");
const { calculatePricing } = require("../PricingEngine/carbonPricingCalculator");

// Config paths
const shareConfigPath = path.resolve(__dirname, "../Config/shareClassConfig.json");
const marketMetricsPath = path.resolve(__dirname, "../Config/marketMetricsConfig.json");
const sharePriceLogPath = path.resolve(__dirname, "../Logs/sharePriceAdjustments.log");

/**
 * Adjust share prices based on token performance and market metrics.
 * @returns {Object} - Adjusted share prices for each class.
 */
async function adjustSharePrices() {
    try {
        console.log("Loading configurations...");
        const shareConfig = await fs.readJson(shareConfigPath);
        const marketMetrics = await fs.readJson(marketMetricsPath);

        console.log("Calculating token pricing...");
        const { adjustedTokenPrice } = await calculateTokenPrice();

        console.log("Calculating carbon-based pricing...");
        const { carbonPricePerKg } = await calculatePricing();

        // Extract base share prices and market data
        const { basePrices } = shareConfig;
        const { marketDemand, demandMultiplier } = marketMetrics;

        // Adjust share prices based on token price and market metrics
        const adjustments = {
            ClassA: (
                basePrices.ClassA +
                adjustedTokenPrice * 0.1 * demandMultiplier -
                carbonPricePerKg * 0.05
            ).toFixed(2),
            ClassB: (
                basePrices.ClassB +
                adjustedTokenPrice * 0.2 * demandMultiplier -
                carbonPricePerKg * 0.03
            ).toFixed(2),
            ClassC: (
                basePrices.ClassC +
                adjustedTokenPrice * 0.3 * demandMultiplier -
                carbonPricePerKg * 0.02
            ).toFixed(2),
            ClassD: (
                basePrices.ClassD +
                adjustedTokenPrice * 0.4 * demandMultiplier -
                carbonPricePerKg * 0.01
            ).toFixed(2),
        };

        console.log("Share prices adjusted successfully.");
        return adjustments;
    } catch (error) {
        console.error("Error adjusting share prices:", error.message);
        throw error;
    }
}

/**
 * Log share price adjustments to a log file.
 * @param {Object} adjustments - Adjusted share prices.
 */
async function logAdjustments(adjustments) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            adjustments,
        };

        await fs.appendFile(sharePriceLogPath, JSON.stringify(logEntry, null, 2) + ",\n");
        console.log("Share price adjustments logged successfully.");
    } catch (error) {
        console.error("Error logging share price adjustments:", error.message);
    }
}

/**
 * Executes the share price adjustment process and logs the results.
 */
async function executeSharePriceAdjustment() {
    try {
        console.log("Starting share price adjustment...");
        const adjustments = await adjustSharePrices();
        console.log("Logging adjustments...");
        await logAdjustments(adjustments);
        console.log("Share price adjustment completed.");
        return adjustments;
    } catch (error) {
        console.error("Failed to adjust share prices:", error.message);
    }
}

// Execute the share price adjustment if called directly
if (require.main === module) {
    executeSharePriceAdjustment()
        .then((adjustments) => {
            console.log("Final Adjustments:", adjustments);
        })
        .catch((error) => {
            console.error("Critical error during share price adjustment:", error.message);
        });
}

module.exports = { adjustSharePrices, logAdjustments, executeSharePriceAdjustment };
