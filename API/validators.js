"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Validators
 *
 * Description:
 * Provides reusable validation functions for incoming API requests. Ensures
 * that data adheres to expected formats, preventing invalid or malicious input.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Validate the `nodeId` or `supernodeId` parameter.
 * Ensures the ID matches the expected format (e.g., numeric or specific patterns).
 */
const validateNodeId = [
    param("nodeId")
        .matches(/^[0-9]{4}$/)
        .withMessage("Node ID must be a 4-digit numeric string."),
];

/**
 * Validate the `supernodeId` parameter.
 * Ensures the ID matches the expected format (e.g., numeric or specific patterns).
 */
const validateSupernodeId = [
    param("supernodeId")
        .matches(/^[0-9]{4}$/)
        .withMessage("Supernode ID must be a 4-digit numeric string."),
];

/**
 * Validate the `query` body for analytics queries.
 * Ensures the query is a non-empty string.
 */
const validateAnalyticsQuery = [
    body("query")
        .isString()
        .withMessage("Query must be a string.")
        .notEmpty()
        .withMessage("Query cannot be empty."),
];

/**
 * Validate the `type` parameter for report generation.
 * Ensures it is one of the allowed report types (e.g., `network`, `node`, `system`).
 */
const validateReportType = [
    param("type")
        .isIn(["network", "node", "system"])
        .withMessage("Invalid report type. Allowed values are 'network', 'node', or 'system'."),
];

/**
 * Middleware to handle validation errors.
 * Returns a standardized error response if validation fails.
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array(),
        });
    }
    next();
}

module.exports = {
    validateNodeId,
    validateSupernodeId,
    validateAnalyticsQuery,
    validateReportType,
    handleValidationErrors,
};
