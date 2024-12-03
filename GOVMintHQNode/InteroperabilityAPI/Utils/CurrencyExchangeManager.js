"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Currency Exchange Manager
//
// Description:
// Manages supported currencies and integrates with exchange rate providers
// to enable dynamic updates for government-backed cryptocurrency systems.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Configuration
const CONFIG_FILE = path.join(__dirname, "../Config/CurrencyConfig.json");
const EXCHANGE_RATES_API = process.env.EXCHANGE_RATES_API || "https://api.exchangerate.atomic";

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "currency-exchange-error.log", level: "error" }),
        new winston.transports.File({ filename: "currency-exchange.log" }),
    ],
});

/**
 * Load supported currencies from configuration.
 * @returns {Array<string>} - List of supported currencies.
 */
function loadSupportedCurrencies() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
        return config.SupportedCurrencies || [];
    } catch (error) {
        logger.error("Error loading supported currencies:", error.message);
        throw new Error("Failed to load currency configuration.");
    }
}

/**
 * Fetch exchange rates for supported currencies.
 * @returns {Promise<Object>} - Exchange rate data.
 */
async function fetchExchangeRates() {
    const currencies = loadSupportedCurrencies().join(",");

    try {
        logger.info("Fetching exchange rates...");
        const response = await axios.get(`${EXCHANGE_RATES_API}?currencies=${currencies}`);
        logger.info("Exchange rates fetched successfully.");
        return response.data;
    } catch (error) {
        logger.error("Error fetching exchange rates:", error.message);
        throw new Error("Failed to fetch exchange rates.");
    }
}

/**
 * Update currency configuration dynamically.
 * @param {Array<string>} newCurrencies - List of new currencies to add.
 * @returns {void}
 */
function updateSupportedCurrencies(newCurrencies) {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
        const updatedCurrencies = Array.from(new Set([...config.SupportedCurrencies, ...newCurrencies]));

        config.SupportedCurrencies = updatedCurrencies;

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4), "utf8");
        logger.info("Supported currencies updated successfully.");
    } catch (error) {
        logger.error("Error updating supported currencies:", error.message);
        throw new Error("Failed to update supported currencies.");
    }
}

/**
 * Validate currency support.
 * @param {string} currency - Currency code to validate.
 * @returns {boolean} - True if currency is supported, false otherwise.
 */
function isCurrencySupported(currency) {
    const supportedCurrencies = loadSupportedCurrencies();
    return supportedCurrencies.includes(currency.toUpperCase());
}

module.exports = {
    loadSupportedCurrencies,
    fetchExchangeRates,
    updateSupportedCurrencies,
    isCurrencySupported,
};
