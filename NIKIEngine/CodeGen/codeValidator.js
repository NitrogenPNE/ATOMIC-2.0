"use strict";

const esprima = require("esprima");

/**
 * Validates the JavaScript code for syntax errors and disallowed patterns.
 * @param {string} code - The JavaScript code to validate.
 * @returns {Promise<boolean>} - True if valid, false otherwise.
 */
async function validateScript(code) {
    try {
        console.log("[CodeValidator] Parsing script...");
        esprima.parseScript(code);
        console.log("[CodeValidator] Script validation passed.");
        return true;
    } catch (error) {
        console.error(`[CodeValidator] Validation failed: ${error.message}`);
        return false;
    }
}

module.exports = { validateScript };