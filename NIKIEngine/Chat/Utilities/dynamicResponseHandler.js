"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Dynamic Response Handler
//
// Description:
// Dynamically generates and manages responses for the NIKI chat system.
// Integrates with the knowledge base, APIs, and user context to ensure 
// accurate, timely, and context-aware communication.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const apiConnector = require("./apiConnector");
const messageParser = require("./messageParser");
const responseFormatter = require("./responseFormatter");

// **Paths**
const knowledgeBasePath = path.resolve(__dirname, "../Config/knowledgeBase.json");
let knowledgeBase;

/**
 * Load the knowledge base from a JSON file.
 * @returns {Promise<Object>} - Knowledge base object.
 */
async function loadKnowledgeBase() {
    if (!knowledgeBase) {
        try {
            knowledgeBase = await fs.readJson(knowledgeBasePath);
            console.log("[DynamicResponseHandler] Knowledge base loaded successfully.");
        } catch (error) {
            console.error(`[DynamicResponseHandler] Error loading knowledge base: ${error.message}`);
            throw new Error("Failed to load knowledge base.");
        }
    }
    return knowledgeBase;
}

/**
 * Generate a dynamic response based on the user's query.
 * @param {string} userQuery - The user's input message.
 * @param {Object} userContext - Contextual information about the user.
 * @returns {Promise<string>} - Generated response.
 */
async function generateResponse(userQuery, userContext = {}) {
    const parsedQuery = messageParser.parse(userQuery);
    const kb = await loadKnowledgeBase();

    // Try finding a direct match in the knowledge base
    const kbResponse = findKnowledgeBaseResponse(parsedQuery, kb);
    if (kbResponse) return kbResponse;

    // If no direct match, query external APIs or generate intelligent responses
    const dynamicResponse = await queryDynamicSources(parsedQuery, userContext);
    return dynamicResponse || kb.general.fallbackMessage;
}

/**
 * Find a matching response in the knowledge base.
 * @param {Object} parsedQuery - Parsed user query.
 * @param {Object} kb - Knowledge base object.
 * @returns {string|null} - Matching response or null if not found.
 */
function findKnowledgeBaseResponse(parsedQuery, kb) {
    for (const [topic, data] of Object.entries(kb)) {
        if (data.keywords && data.keywords.some((kw) => parsedQuery.tokens.includes(kw))) {
            return responseFormatter.format(data.responseTemplate || data.info, parsedQuery.context);
        }
    }
    return null;
}

/**
 * Query external sources for dynamic data.
 * @param {Object} parsedQuery - Parsed user query.
 * @param {Object} userContext - Contextual information about the user.
 * @returns {Promise<string|null>} - Dynamic response or null if not found.
 */
async function queryDynamicSources(parsedQuery, userContext) {
    try {
        // Example: Query system metrics
        if (parsedQuery.intent === "systemHealth") {
            const metrics = await apiConnector.fetch("/system/metrics", userContext);
            return responseFormatter.format("Current system health metrics: {{metrics}}", { metrics });
        }

        // Example: Query subscription details
        if (parsedQuery.intent === "subscriptionStatus") {
            const subscription = await apiConnector.fetch(`/subscriptions/${userContext.hqId}`, userContext);
            return responseFormatter.format("Your subscription status: {{subscription}}", { subscription });
        }

        return null; // No dynamic sources match the query
    } catch (error) {
        console.error(`[DynamicResponseHandler] Error querying dynamic sources: ${error.message}`);
        return null;
    }
}

module.exports = {
    generateResponse,
};

// ------------------------------------------------------------------------------
// End of Module: Dynamic Response Handler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for dynamic response generation.
// ------------------------------------------------------------------------------