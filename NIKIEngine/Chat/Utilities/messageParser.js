"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Message Parser
//
// Description:
// Parses incoming user messages for the NIKI chat engine. Identifies intents,
// keywords, and entities to route commands and provide intelligent responses.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const natural = require("natural");
const path = require("path");
const fs = require("fs-extra");

// **Paths**
const INTENT_MAP_PATH = path.resolve(__dirname, "../Config/chatIntentMap.json");

/**
 * Loads intent mapping for user messages.
 * @returns {Promise<Object>} - Intent mapping data.
 */
async function loadIntentMap() {
    try {
        const intentMap = await fs.readJson(INTENT_MAP_PATH, { throws: false }) || {};
        console.log("[MessageParser] Intent map loaded successfully.");
        return intentMap;
    } catch (error) {
        console.error(`[MessageParser] Failed to load intent map: ${error.message}`);
        throw new Error("Could not load intent mapping configuration.");
    }
}

/**
 * Tokenizes and cleans a user message.
 * @param {string} message - The raw user message.
 * @returns {Array<string>} - Tokenized and cleaned words.
 */
function tokenizeMessage(message) {
    const tokenizer = new natural.WordTokenizer();
    return tokenizer.tokenize(message.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ""));
}

/**
 * Matches a message to an intent based on keywords and patterns.
 * @param {string} message - The user message to analyze.
 * @param {Object} intentMap - Mapping of intents to keywords and patterns.
 * @returns {string|null} - The identified intent or null if none match.
 */
function identifyIntent(message, intentMap) {
    const tokens = tokenizeMessage(message);

    for (const [intent, data] of Object.entries(intentMap)) {
        const { keywords = [], patterns = [] } = data;

        // Check keywords
        if (keywords.some((keyword) => tokens.includes(keyword))) {
            return intent;
        }

        // Check regex patterns
        for (const pattern of patterns) {
            const regex = new RegExp(pattern, "i");
            if (regex.test(message)) {
                return intent;
            }
        }
    }

    return null;
}

/**
 * Parses an incoming message to extract intent, entities, and context.
 * @param {string} message - The raw user message.
 * @returns {Promise<Object>} - Parsed message data including intent and tokens.
 */
async function parseMessage(message) {
    const intentMap = await loadIntentMap();
    const intent = identifyIntent(message, intentMap);
    const tokens = tokenizeMessage(message);

    return {
        rawMessage: message,
        intent: intent || "unknown",
        tokens,
    };
}

module.exports = {
    parseMessage,
    tokenizeMessage,
    identifyIntent,
};

// ------------------------------------------------------------------------------
// End of Module: Message Parser
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for parsing and intent detection.
// ------------------------------------------------------------------------------