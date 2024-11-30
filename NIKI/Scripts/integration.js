"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: NIKI Integration
 *
 * Description:
 * Provides integration with NIKI, the GPT-J 6B-based AI assistant, for generating
 * insights, recommendations, and data analysis reports.
 *
 * Dependencies:
 * - axios: For API communication with the NIKI model.
 * - fs-extra: For configuration and logging purposes.
 * ------------------------------------------------------------------------------
 */

const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

// Configuration paths
const CONFIG_PATH = path.resolve(__dirname, "../Config/nikiConfig.json");
const LOG_PATH = path.resolve(__dirname, "../Logs/nikiInteraction.log");

// Ensure log directory exists
fs.ensureFileSync(LOG_PATH);

/**
 * Load NIKI configuration.
 * @returns {Object} - Configuration details for NIKI integration.
 */
async function loadNIKIConfig() {
    if (!(await fs.pathExists(CONFIG_PATH))) {
        throw new Error(`NIKI configuration file not found at ${CONFIG_PATH}`);
    }

    return fs.readJson(CONFIG_PATH);
}

/**
 * Query the NIKI AI assistant with a given prompt.
 * @param {string} prompt - The prompt to send to NIKI.
 * @returns {Promise<Object>} - Response from the NIKI assistant.
 */
async function queryNIKI(prompt) {
    try {
        const { apiUrl, apiKey } = await loadNIKIConfig();

        // Send request to NIKI
        const response = await axios.post(
            apiUrl,
            { prompt, maxTokens: 1024, temperature: 0.7 },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        // Log the interaction
        const logEntry = {
            timestamp: new Date().toISOString(),
            prompt,
            response: response.data,
        };
        await fs.appendFile(LOG_PATH, JSON.stringify(logEntry, null, 2) + ",\n");

        return response.data;
    } catch (error) {
        console.error("Error querying NIKI:", error.message);
        throw error;
    }
}

/**
 * Test the NIKI integration by sending a sample query.
 */
async function testNIKIIntegration() {
    const testPrompt = "Generate a brief summary of carbon pricing trends in Canada.";
    try {
        const response = await queryNIKI(testPrompt);
        console.log("NIKI Response:", response);
    } catch (error) {
        console.error("NIKI integration test failed:", error.message);
    }
}

// Export the integration functions
module.exports = {
    queryNIKI,
    testNIKIIntegration,
};

// Execute a test if this script is run directly
if (require.main === module) {
    testNIKIIntegration();
}
