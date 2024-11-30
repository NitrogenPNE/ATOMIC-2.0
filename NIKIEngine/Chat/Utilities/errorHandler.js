"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Error Handler
//
// Description:
// Provides centralized error handling for the NIKI chat engine. Captures and logs
// errors from all chat-related modules, ensuring seamless user experience.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// **Paths**
const ERROR_LOG_PATH = path.resolve(__dirname, "../Logs/errorLogs.json");

/**
 * Logs an error to the error log file.
 * @param {Error} error - The error object to log.
 * @param {string} module - The name of the module where the error occurred.
 * @param {Object} [context] - Additional context information.
 */
async function logError(error, module, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        module,
        message: error.message,
        stack: error.stack,
        context
    };

    try {
        await fs.ensureFile(ERROR_LOG_PATH);
        const existingLogs = await fs.readJson(ERROR_LOG_PATH, { throws: false }) || [];
        existingLogs.push(logEntry);
        await fs.writeJson(ERROR_LOG_PATH, existingLogs, { spaces: 2 });

        console.error(`[ErrorHandler] Logged error from module: ${module}`);
    } catch (writeError) {
        console.error(`[ErrorHandler] Failed to log error: ${writeError.message}`);
    }
}

/**
 * Handles an error by logging it and optionally providing a response to the user.
 * @param {Error} error - The error object to handle.
 * @param {string} module - The name of the module where the error occurred.
 * @param {Object} [context] - Additional context information.
 * @param {Function} [responseCallback] - Optional callback to respond to the user.
 */
async function handleError(error, module, context = {}, responseCallback = null) {
    console.error(`[ErrorHandler] Handling error in module: ${module}`);
    await logError(error, module, context);

    if (responseCallback) {
        responseCallback({
            type: "error",
            message: "An unexpected error occurred. Please try again later."
        });
    }
}

/**
 * Middleware-like function for async error handling in chat modules.
 * @param {Function} asyncFunction - The async function to wrap.
 * @param {string} module - The name of the module where the function resides.
 * @returns {Function} - Wrapped function with error handling.
 */
function wrapWithErrorHandler(asyncFunction, module) {
    return async function (...args) {
        try {
            return await asyncFunction(...args);
        } catch (error) {
            await handleError(error, module, {}, args[1]?.responseCallback);
        }
    };
}

module.exports = {
    logError,
    handleError,
    wrapWithErrorHandler
};

// ------------------------------------------------------------------------------
// End of Module: Error Handler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for centralized error handling.
// ------------------------------------------------------------------------------