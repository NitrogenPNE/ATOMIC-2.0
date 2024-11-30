"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Context Manager
//
// Description:
// Manages user context for NIKI's chat interface, including session tracking, 
// user preferences, and context-based responses. Ensures personalized and 
// consistent user interactions.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// File to store session context data
const contextStorePath = path.resolve(__dirname, "../Logs/contextStore.json");

// Default session timeout (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Loads the user context from the context store.
 * @param {string} userId - User's unique identifier.
 * @returns {Promise<Object>} - User context data.
 */
async function loadUserContext(userId) {
    try {
        if (!(await fs.pathExists(contextStorePath))) {
            return initializeContext(userId);
        }

        const contextData = await fs.readJson(contextStorePath);
        return contextData[userId] || initializeContext(userId);
    } catch (error) {
        console.error(`[ContextManager] Error loading context for user ${userId}: ${error.message}`);
        return initializeContext(userId);
    }
}

/**
 * Saves the user context to the context store.
 * @param {string} userId - User's unique identifier.
 * @param {Object} context - User context data to save.
 * @returns {Promise<void>}
 */
async function saveUserContext(userId, context) {
    try {
        const contextData = (await fs.pathExists(contextStorePath)) ? await fs.readJson(contextStorePath) : {};
        contextData[userId] = { ...context, lastInteraction: Date.now() };
        await fs.writeJson(contextStorePath, contextData, { spaces: 2 });
    } catch (error) {
        console.error(`[ContextManager] Error saving context for user ${userId}: ${error.message}`);
    }
}

/**
 * Initializes a new user context.
 * @param {string} userId - User's unique identifier.
 * @returns {Object} - New user context.
 */
function initializeContext(userId) {
    console.log(`[ContextManager] Initializing new context for user ${userId}`);
    return {
        userId,
        preferences: {},
        sessionActive: true,
        lastInteraction: Date.now()
    };
}

/**
 * Updates user preferences within the context.
 * @param {string} userId - User's unique identifier.
 * @param {Object} preferences - Preferences to update.
 * @returns {Promise<void>}
 */
async function updateUserPreferences(userId, preferences) {
    const context = await loadUserContext(userId);
    context.preferences = { ...context.preferences, ...preferences };
    await saveUserContext(userId, context);
}

/**
 * Checks if the user's session is still active.
 * @param {string} userId - User's unique identifier.
 * @returns {Promise<boolean>} - True if session is active; false otherwise.
 */
async function isSessionActive(userId) {
    const context = await loadUserContext(userId);
    const timeSinceLastInteraction = Date.now() - context.lastInteraction;

    if (timeSinceLastInteraction > SESSION_TIMEOUT) {
        console.log(`[ContextManager] Session expired for user ${userId}`);
        context.sessionActive = false;
        await saveUserContext(userId, context);
        return false;
    }

    return true;
}

/**
 * Resets the user's context to its default state.
 * @param {string} userId - User's unique identifier.
 * @returns {Promise<void>}
 */
async function resetUserContext(userId) {
    const context = initializeContext(userId);
    await saveUserContext(userId, context);
    console.log(`[ContextManager] Context reset for user ${userId}`);
}

module.exports = {
    loadUserContext,
    saveUserContext,
    updateUserPreferences,
    isSessionActive,
    resetUserContext
};

// ------------------------------------------------------------------------------
// End of Module: Context Manager
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for managing chat user context.
// ------------------------------------------------------------------------------