"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Carbon Pricing Updater
//
// Description:
// Fetches real-time carbon pricing data and updates the system configuration.
// Ensures alignment with blockchain logging for traceability.
//
// Dependencies:
// - blockchainLogger.js: Logs updates to the blockchain for transparency.
// - carbonPricing.json: Stores the latest carbon pricing data.
// - marketMetricsConfig.json: Provides configuration for external API endpoints.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { logBlockchainEvent } = require("./blockchainLogger");

// Paths
const CARBON_PRICING_PATH = path.resolve(__dirname, "../Data/carbonPricing.json");
const MARKET_METRICS_CONFIG_PATH = path.resolve(__dirname, "../Config/marketMetricsConfig.json");
const LOG_PATH = path.resolve(__dirname, "../Logs/carbonUpdates.log");

// Default fallback values
const DEFAULT_CARBON_PRICE = 65.00; // CAD per kg CO₂
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // Update every 24 hours

/**
 * Fetches real-time carbon pricing from external APIs.
 * @returns {Promise<number>} - The current carbon price in CAD per kg CO₂.
 */
async function fetchCarbonPricing() {
    try {
        const marketMetricsConfig = await fs.readJson(MARKET_METRICS_CONFIG_PATH);
        const { apiUrl, apiKey } = marketMetricsConfig;

        if (!apiUrl || !apiKey) {
            throw new Error("Missing API configuration in marketMetricsConfig.json.");
        }

        const response = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (response.status !== 200 || !response.data?.carbonPrice) {
            throw new Error("Invalid response from carbon pricing API.");
        }

        return parseFloat(response.data.carbonPrice);
    } catch (error) {
        console.error("Error fetching carbon pricing:", error.message);
        return DEFAULT_CARBON_PRICE; // Fallback to default if API fails
    }
}

/**
 * Updates the carbon pricing file and logs changes to the blockchain.
 * @param {number} carbonPrice - The updated carbon price in CAD per kg CO₂.
 */
async function updateCarbonPricing(carbonPrice) {
    try {
        // Load existing data
        const carbonPricingData = (await fs.readJson(CARBON_PRICING_PATH).catch(() => ({}))) || {};
        const previousPrice = carbonPricingData.currentPrice || DEFAULT_CARBON_PRICE;

        // Update carbon pricing
        carbonPricingData.currentPrice = carbonPrice;
        carbonPricingData.lastUpdated = new Date().toISOString();

        await fs.writeJson(CARBON_PRICING_PATH, carbonPricingData, { spaces: 2 });

        // Log update to blockchain
        await logBlockchainEvent({
            action: "Update Carbon Pricing",
            details: {
                previousPrice,
                updatedPrice: carbonPrice,
                timestamp: carbonPricingData.lastUpdated,
            },
        });

        // Log update to local logs
        await fs.appendFile(
            LOG_PATH,
            JSON.stringify({
                timestamp: carbonPricingData.lastUpdated,
                previousPrice,
                updatedPrice: carbonPrice,
            }) + ",\n"
        );

        console.log("Carbon pricing updated successfully.");
    } catch (error) {
        console.error("Error updating carbon pricing:", error.message);
        throw error;
    }
}

/**
 * Main function to fetch and update carbon pricing.
 */
async function executeCarbonPricingUpdate() {
    try {
        console.log("Fetching latest carbon pricing...");
        const carbonPrice = await fetchCarbonPricing();

        console.log(`Updating carbon pricing to ${carbonPrice} CAD/kg CO₂...`);
        await updateCarbonPricing(carbonPrice);
    } catch (error) {
        console.error("Error during carbon pricing update:", error.message);
    }
}

// Execute the updater periodically
if (require.main === module) {
    console.log("Starting carbon pricing updater...");
    executeCarbonPricingUpdate();
    setInterval(executeCarbonPricingUpdate, UPDATE_INTERVAL);
}

module.exports = {
    fetchCarbonPricing,
    updateCarbonPricing,
    executeCarbonPricingUpdate,
};