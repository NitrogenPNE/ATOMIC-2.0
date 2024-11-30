"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// Configuration Loader for ATOMIC HQ Node
//
// Description:
// Utility module to load and validate configuration files for the HQ Node.
// Ensures the configurations meet the expected schema and provides helpful
// error messages for invalid or missing settings.
//
// Features:
// - Load JSON configuration files.
// - Validate required fields in the configuration.
// - Provide default settings for missing optional fields.
//
// Dependencies:
// - fs-extra: For reading JSON configuration files.
// - lodash: For deep object validation.
//
// Author: ATOMIC, Ltd.
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const _ = require("lodash");

/**
 * Load a JSON configuration file from the given path.
 * @param {string} filePath - Path to the configuration file.
 * @returns {Promise<Object>} - Parsed configuration object.
 */
async function loadConfig(filePath) {
    try {
        console.log(`Loading configuration from: ${filePath}`);
        const config = await fs.readJson(filePath);

        // Validate the loaded configuration
        validateConfig(config);

        console.log("Configuration loaded successfully.");
        return config;
    } catch (error) {
        console.error(`Failed to load configuration from ${filePath}:`, error.message);
        throw new Error(`Configuration loading error: ${error.message}`);
    }
}

/**
 * Validate the structure of the configuration object.
 * @param {Object} config - Configuration object to validate.
 * @throws {Error} - Throws an error if the configuration is invalid.
 */
function validateConfig(config) {
    const requiredFields = ["nodeId", "environment", "network", "monitoring", "arbitration", "orchestration", "validation"];

    for (const field of requiredFields) {
        if (!_.has(config, field)) {
            throw new Error(`Missing required configuration field: ${field}`);
        }
    }

    console.log("Configuration validation passed.");
}

module.exports = {
    loadConfig,
};
