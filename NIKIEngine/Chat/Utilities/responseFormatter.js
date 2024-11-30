"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Response Formatter
//
// Description:
// Formats NIKI's responses for chat interaction, ensuring consistency in 
// tone, structure, and readability. This module is responsible for applying
// templates, including error, feedback, and general response formats.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Paths to Templates
const TEMPLATE_PATHS = {
    error: path.resolve(__dirname, "../Templates/errorTemplates.json"),
    feedback: path.resolve(__dirname, "../Templates/feedbackTemplate.json"),
    response: path.resolve(__dirname, "../Templates/responseTemplates.json"),
    welcome: path.resolve(__dirname, "../Templates/welcomeTemplate.json"),
};

/**
 * Load a specific template by type.
 * @param {string} templateType - The type of template to load (e.g., "error", "feedback").
 * @returns {Promise<Object>} - The loaded template object.
 */
async function loadTemplate(templateType) {
    try {
        const templatePath = TEMPLATE_PATHS[templateType];
        if (!templatePath) {
            throw new Error(`Template type '${templateType}' is not recognized.`);
        }
        const template = await fs.readJson(templatePath);
        console.log(`[ResponseFormatter] Loaded ${templateType} template.`);
        return template;
    } catch (error) {
        console.error(`[ResponseFormatter] Failed to load template: ${error.message}`);
        throw new Error("Template loading error.");
    }
}

/**
 * Formats a generic response using the response template.
 * @param {string} message - The message content.
 * @param {string} [context] - Optional context to include in the response.
 * @returns {Promise<string>} - The formatted response.
 */
async function formatResponse(message, context = "") {
    const template = await loadTemplate("response");
    const formattedResponse = template.base.replace("{message}", message).replace("{context}", context || "N/A");
    return formattedResponse;
}

/**
 * Formats an error response using the error template.
 * @param {string} errorMessage - The error message.
 * @param {string} [code] - Optional error code.
 * @returns {Promise<string>} - The formatted error response.
 */
async function formatErrorResponse(errorMessage, code = "500") {
    const template = await loadTemplate("error");
    const formattedError = template.base.replace("{errorMessage}", errorMessage).replace("{code}", code);
    return formattedError;
}

/**
 * Formats a feedback prompt using the feedback template.
 * @returns {Promise<string>} - The formatted feedback prompt.
 */
async function formatFeedbackPrompt() {
    const template = await loadTemplate("feedback");
    return template.prompt;
}

/**
 * Formats a welcome message using the welcome template.
 * @returns {Promise<string>} - The formatted welcome message.
 */
async function formatWelcomeMessage() {
    const template = await loadTemplate("welcome");
    return template.message;
}

module.exports = {
    formatResponse,
    formatErrorResponse,
    formatFeedbackPrompt,
    formatWelcomeMessage,
};

// ------------------------------------------------------------------------------
// End of Module: Response Formatter
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for response formatting.
// ------------------------------------------------------------------------------