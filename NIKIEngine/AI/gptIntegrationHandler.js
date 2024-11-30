"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: GPT Integration Handler
//
// Description:
// Handles communication with a GPT-J backend for generating responses and 
// assisting in tasks within the NIKIEngine. This module sends user input to 
// the GPT-J model, processes responses, and ensures proper formatting for 
// the NIKI chat interface.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");

const GPT_API_URL = "http://localhost:5000/generate"; // Replace with your GPT-J API endpoint
const MAX_RESPONSE_TOKENS = 100; // Token limit for responses

/**
 * Sends a query to the GPT-J backend and returns a response.
 * @param {string} prompt - The user's input or task description.
 * @param {Object} options - Additional configuration for the query.
 * @returns {Promise<string>} - The GPT-J generated response.
 */
async function queryGPT(prompt, options = {}) {
    try {
        // Build request payload
        const payload = {
            prompt: prompt,
            max_tokens: options.maxTokens || MAX_RESPONSE_TOKENS,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
        };

        // Send the request
        const response = await axios.post(GPT_API_URL, payload);

        // Handle successful response
        if (response.status === 200 && response.data) {
            console.log("[GPT Integration] Response received:", response.data.text);
            return response.data.text.trim();
        } else {
            throw new Error(`[GPT Integration] Unexpected response: ${response.status}`);
        }
    } catch (error) {
        console.error("[GPT Integration] Error querying GPT:", error.message);
        throw new Error("GPT query failed. Please try again.");
    }
}

/**
 * Formats GPT responses for the NIKI chat interface.
 * @param {string} response - Raw GPT-J output.
 * @returns {Object} - Formatted response object for the chat UI.
 */
function formatResponseForChat(response) {
    return {
        sender: "NIKI",
        message: response,
        timestamp: new Date().toISOString(),
    };
}

module.exports = {
    queryGPT,
    formatResponseForChat,
};

// ------------------------------------------------------------------------------
// End of Module: GPT Integration Handler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial GPT-J integration implementation for NIKIEngine.
// ------------------------------------------------------------------------------