"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Market Metrics Updater
//
// Description:
// Dynamically fetches and updates market metrics including carbon pricing,
// token demand, and node-based demand multipliers. Supports integration with
// external APIs and ensures consistency with ATOMIC's ecosystem.
//
// Dependencies:
// - fs-extra: For file read/write operations.
// - path: For file path management.
// - axios: For API calls to external data sources.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// Config paths
const marketMetricsPath = path.resolve(__dirname, "../Config/marketMetricsConfig.json");
const carbonPricingPath = path.resolve(__dirname, "../Data/carbonPricing.json");
const tokenMetricsPath = path.resolve(__dirname, "../Data/tokenMetrics.json");

// Constants
const DEFAULT_CARBON_API = "https://api.carbonpricingexample.com/current";
const DEFAULT_DEMAND_API = "https://api.marketdemandexample.com/demand";
const DEFAULT_TOKEN_API = "https://api.tokenmetrics.example.com/current";

/**
 * Fetches the current carbon pricing from an external API.
 * @returns {number} - Current carbon price per kg CO₂.
 */
async function fetchCarbonPricing() {
    try {
        console.log("Fetching carbon pricing data...");
        const response = await axios.get(DEFAULT_CARBON_API);
        const carbonPrice = response.data.pricePerKg || 65.0; // Default to 65.0 CAD if unavailable
        console.log(`Carbon price retrieved: ${carbonPrice} CAD/kg CO₂`);
        return carbonPrice;
    } catch (error) {
        console.error("Error fetching carbon pricing data:", error.message);
        throw new Error("Failed to fetch carbon pricing.");
    }
}

/**
 * Fetches the current market demand metrics from an external API.
 * @returns {Object} - Current market demand data.
 */
async function fetchMarketDemand() {
    try {
        console.log("Fetching market demand data...");
        const response = await axios.get(DEFAULT_DEMAND_API);
        const demandMetrics = {
            marketDemand: response.data.marketDemand || 1.0, // Default to neutral demand
            demandMultiplier: response.data.demandMultiplier || 1.0,
        };
        console.log("Market demand metrics retrieved:", demandMetrics);
        return demandMetrics;
    } catch (error) {
        console.error("Error fetching market demand data:", error.message);
        throw new Error("Failed to fetch market demand.");
    }
}

/**
 * Fetches the current token metrics from an external API.
 * @returns {Object} - Current token metrics including demand and circulation.
 */
async function fetchTokenMetrics() {
    try {
        console.log("Fetching token metrics data...");
        const response = await axios.get(DEFAULT_TOKEN_API);
        const tokenMetrics = {
            tokenDemand: response.data.tokenDemand || 1.0, // Default to neutral demand
            circulatingSupply: response.data.circulatingSupply || 0,
            totalSupply: response.data.totalSupply || 0,
        };
        console.log("Token metrics retrieved:", tokenMetrics);
        return tokenMetrics;
    } catch (error) {
        console.error("Error fetching token metrics data:", error.message);
        throw new Error("Failed to fetch token metrics.");
    }
}

/**
 * Updates market metrics based on the fetched data.
 */
async function updateMarketMetrics() {
    try {
        console.log("Updating market metrics...");

        // Fetch external data
        const carbonPrice = await fetchCarbonPricing();
        const demandMetrics = await fetchMarketDemand();
        const tokenMetrics = await fetchTokenMetrics();

        // Update carbon pricing
        const carbonPricingData = { currentPrice: carbonPrice };
        await fs.writeJson(carbonPricingPath, carbonPricingData, { spaces: 2 });

        // Update market metrics
        const marketMetrics = {
            marketDemand: demandMetrics.marketDemand,
            demandMultiplier: demandMetrics.demandMultiplier,
            carbonFootprintMultiplier: 1.0, // Default value, can be adjusted dynamically
        };
        await fs.writeJson(marketMetricsPath, marketMetrics, { spaces: 2 });

        // Update token metrics
        const tokenMetricsData = {
            tokenDemand: tokenMetrics.tokenDemand,
            circulatingSupply: tokenMetrics.circulatingSupply,
            totalSupply: tokenMetrics.totalSupply,
        };
        await fs.writeJson(tokenMetricsPath, tokenMetricsData, { spaces: 2 });

        console.log("Market metrics updated successfully.");
    } catch (error) {
        console.error("Error updating market metrics:", error.message);
        throw error;
    }
}

// Execute the updater if called directly
if (require.main === module) {
    updateMarketMetrics()
        .then(() => {
            console.log("Market metrics updated successfully.");
        })
        .catch((error) => {
            console.error("Critical error during market metrics update:", error.message);
        });
}

module.exports = { updateMarketMetrics, fetchCarbonPricing, fetchMarketDemand, fetchTokenMetrics };
