"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: NIKI Chat Engine
//
// Description:
// This script powers the NIKI chat interface, supporting multilingual interactions, 
// military-grade security, and real-time processing of user queries. It integrates 
// with AI modules, analytics, and the broader ATOMIC system for comprehensive responses.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { translate } = require("../Utilities/languageProcessor");
const { generateResponse } = require("../Utilities/responseGenerator");
const { logChat } = require("../Logs/chatLogger");
const chatConfig = require("../Config/chatConfig.json");

// Global Constants
const SUPPORTED_LANGUAGES = chatConfig.supportedLanguages || ["en", "fr", "es", "de", "zh"];
const DEFAULT_LANGUAGE = chatConfig.defaultLanguage || "en";

/**
 * Processes incoming user messages.
 * @param {Object} userInput - User input containing message and metadata.
 * @param {string} userInput.message - The user's message.
 * @param {string} userInput.language - Language of the message (ISO 639-1 code).
 * @param {Object} userInput.context - Context for the conversation.
 * @returns {Promise<Object>} - AI response and additional metadata.
 */
async function processMessage(userInput) {
    const { message, language, context } = userInput;

    try {
        // Step 1: Validate input
        if (!message || typeof message !== "string") {
            throw new Error("Invalid input: Message is required and must be a string.");
        }

        const userLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

        // Step 2: Log incoming message
        await logChat({
            type: "user",
            language: userLanguage,
            message,
            context
        });

        // Step 3: Translate message to system's working language (English)
        const translatedMessage = userLanguage !== "en" ? await translate(message, userLanguage, "en") : message;

        // Step 4: Generate AI response
        const aiResponse = await generateResponse(translatedMessage, context);

        // Step 5: Translate response back to user's language
        const translatedResponse =
            userLanguage !== "en" ? await translate(aiResponse.message, "en", userLanguage) : aiResponse.message;

        // Step 6: Log AI response
        await logChat({
            type: "bot",
            language: userLanguage,
            message: translatedResponse,
            context
        });

        // Step 7: Return the translated response
        return {
            response: translatedResponse,
            metadata: aiResponse.metadata || {}
        };
    } catch (error) {
        console.error(`[ChatEngine] Error processing message: ${error.message}`);

        // Log error for debugging
        await logChat({
            type: "error",
            message: error.message,
            stackTrace: error.stack
        });

        return {
            response: chatConfig.fallbackMessage || "I encountered an error. Please try again later.",
            metadata: { error: error.message }
        };
    }
}

module.exports = {
    processMessage
};

// ------------------------------------------------------------------------------
// End of Module: NIKI Chat Engine
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for multilingual, secure AI interactions.
// ------------------------------------------------------------------------------