"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Utilities
 *
 * Description:
 * Provides reusable utility functions for the ATOMIC API, including token
 * validation, quantum-inspired ID generation, and standardized responses.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const crypto = require("crypto");

/**
 * Generate a quantum-inspired unique identifier.
 * Combines timestamp with a random factor for uniqueness.
 * @returns {string} - Unique identifier.
 */
function generateQuantumId() {
    const baseTime = Date.now();
    const randomFactor = crypto.randomBytes(8).toString("hex");
    return `${baseTime}-${randomFactor}`;
}

/**
 * Verify the validity of an API token.
 * This is a placeholder for more advanced token validation mechanisms.
 * @param {string} token - API token to validate.
 * @returns {boolean} - True if the token is valid, false otherwise.
 */
function verifyToken(token) {
    const validToken = process.env.API_TOKEN || "secure-default-token";
    return token === validToken;
}

/**
 * Standardize API responses.
 * @param {boolean} success - Indicates whether the response represents a success.
 * @param {string} message - Message to include in the response.
 * @param {object} [data] - Optional data to include in the response.
 * @returns {object} - Standardized response object.
 */
function createResponse(success, message, data = null) {
    const response = { success, message };
    if (data) {
        response.data = data;
    }
    return response;
}

/**
 * Hash data using SHA-256.
 * @param {string} data - Data to hash.
 * @returns {string} - SHA-256 hash of the input data.
 */
function hashData(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Sleep for a specified duration.
 * Useful for testing asynchronous flows or throttling.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>} - Resolves after the specified time.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    generateQuantumId,
    verifyToken,
    createResponse,
    hashData,
    sleep,
};
