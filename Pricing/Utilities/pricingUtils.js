"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Pricing Utilities
 *
 * Description:
 * Provides utility functions for calculating shard, token, and rebate pricing.
 * These functions are core to the ATOMIC dynamic carbon-based pricing model.
 *
 * Dependencies:
 * - carbonPricing.json: Contains the latest carbon pricing data.
 * - shardConfig.json: Maps shard emissions and other shard properties.
 * - fs-extra: For accessing and managing pricing data.
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Paths to Configuration and Data
const CARBON_PRICING_PATH = path.resolve(__dirname, "../Data/carbonPricing.json");
const SHARD_CONFIG_PATH = path.resolve(__dirname, "../Config/shardConfig.json");

// Constants
const DEFAULT_CARBON_PRICE = 65.0; // CAD per kg CO₂ (fallback)

/**
 * Loads the latest carbon pricing data.
 * @returns {Promise<number>} - Current carbon price in CAD per kg CO₂.
 */
async function getCarbonPrice() {
    try {
        const carbonPricing = await fs.readJson(CARBON_PRICING_PATH);
        return carbonPricing.currentPrice || DEFAULT_CARBON_PRICE;
    } catch (error) {
        console.error("Error loading carbon pricing data:", error.message);
        return DEFAULT_CARBON_PRICE;
    }
}

/**
 * Calculates the base price for a shard based on carbon emissions.
 * @param {number} emissionsPerShard - Emissions in g CO₂ per shard.
 * @param {number} carbonPrice - Carbon price in CAD per kg CO₂.
 * @returns {number} - Base price for the shard in CAD.
 */
function calculateShardBasePrice(emissionsPerShard, carbonPrice) {
    const emissionsKg = emissionsPerShard / 1000;
    return parseFloat((emissionsKg * carbonPrice).toFixed(2));
}

/**
 * Calculates the rebate for carbon savings.
 * @param {number} savingsPerGb - Carbon savings in g CO₂ per GB.
 * @param {number} carbonPrice - Carbon price in CAD per kg CO₂.
 * @param {number} shardSizeGb - Size of the shard in GB.
 * @returns {number} - Rebate amount in CAD.
 */
function calculateRebate(savingsPerGb, carbonPrice, shardSizeGb) {
    const savingsKg = (savingsPerGb * shardSizeGb) / 1000;
    return parseFloat((savingsKg * carbonPrice).toFixed(2));
}

/**
 * Calculates the effective price of a shard after applying rebates.
 * @param {number} basePrice - Base price of the shard in CAD.
 * @param {number} rebate - Rebate amount in CAD.
 * @returns {number} - Effective price for the shard in CAD.
 */
function calculateEffectiveShardPrice(basePrice, rebate) {
    return parseFloat((basePrice - rebate).toFixed(2));
}

/**
 * Calculates the price of a token based on shard cost and token ratio.
 * @param {number} effectiveShardPrice - Effective price of a shard in CAD.
 * @param {number} tokensPerShard - Number of tokens representing one shard.
 * @returns {number} - Token price in CAD.
 */
function calculateTokenPrice(effectiveShardPrice, tokensPerShard) {
    return parseFloat((effectiveShardPrice / tokensPerShard).toFixed(6));
}

/**
 * Retrieves shard configuration data.
 * @returns {Promise<Object>} - Shard configuration, including emissions and size.
 */
async function getShardConfig() {
    try {
        return await fs.readJson(SHARD_CONFIG_PATH);
    } catch (error) {
        console.error("Error loading shard configuration:", error.message);
        throw new Error("Failed to load shard configuration.");
    }
}

/**
 * Calculates shard, token, and rebate pricing using current data.
 * @returns {Promise<Object>} - Comprehensive pricing details.
 */
async function calculatePricing() {
    try {
        // Load data
        const carbonPrice = await getCarbonPrice();
        const shardConfig = await getShardConfig();

        const {
            emissionPerShard,
            rebatePerGb,
            shardSizeGb,
            tokensPerShard,
        } = shardConfig;

        // Pricing calculations
        const baseShardPrice = calculateShardBasePrice(emissionPerShard, carbonPrice);
        const rebate = calculateRebate(rebatePerGb, carbonPrice, shardSizeGb);
        const effectiveShardPrice = calculateEffectiveShardPrice(baseShardPrice, rebate);
        const tokenPrice = calculateTokenPrice(effectiveShardPrice, tokensPerShard);

        return {
            baseShardPrice,
            rebate,
            effectiveShardPrice,
            tokenPrice,
        };
    } catch (error) {
        console.error("Error calculating pricing:", error.message);
        throw error;
    }
}

module.exports = {
    calculateShardBasePrice,
    calculateRebate,
    calculateEffectiveShardPrice,
    calculateTokenPrice,
    calculatePricing,
};