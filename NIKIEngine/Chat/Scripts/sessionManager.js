"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Session Manager
//
// Description:
// Handles user session management for the NIKI chat interface, including session 
// creation, expiration, and retrieval. Ensures secure and efficient session tracking 
// for authenticated users.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const crypto = require("crypto");

// In-memory session store (can be replaced with a database in production)
const sessionStore = new Map();

// Session expiration time in milliseconds (e.g., 30 minutes)
const SESSION_EXPIRATION_TIME = 30 * 60 * 1000;

/**
 * Creates a new session for a user.
 * @param {string} userId - The ID of the user starting a session.
 * @returns {Object} - Session details including session ID and expiration time.
 */
function createSession(userId) {
    const sessionId = generateSessionId();
    const expirationTime = Date.now() + SESSION_EXPIRATION_TIME;

    sessionStore.set(sessionId, { userId, expirationTime });

    console.log(`[SessionManager] Created session for user: ${userId}, session ID: ${sessionId}`);
    return { sessionId, expirationTime };
}

/**
 * Validates if a session is active.
 * @param {string} sessionId - The session ID to validate.
 * @returns {boolean} - True if the session is valid; false otherwise.
 */
function validateSession(sessionId) {
    if (!sessionStore.has(sessionId)) {
        console.warn(`[SessionManager] Invalid session ID: ${sessionId}`);
        return false;
    }

    const session = sessionStore.get(sessionId);
    if (Date.now() > session.expirationTime) {
        console.warn(`[SessionManager] Session expired: ${sessionId}`);
        sessionStore.delete(sessionId);
        return false;
    }

    console.log(`[SessionManager] Valid session: ${sessionId}`);
    return true;
}

/**
 * Retrieves the user ID associated with a session.
 * @param {string} sessionId - The session ID to retrieve.
 * @returns {string|null} - The user ID if the session is valid; null otherwise.
 */
function getSessionUser(sessionId) {
    if (!validateSession(sessionId)) {
        return null;
    }

    const session = sessionStore.get(sessionId);
    console.log(`[SessionManager] Retrieved user ID: ${session.userId} for session: ${sessionId}`);
    return session.userId;
}

/**
 * Ends a session.
 * @param {string} sessionId - The session ID to end.
 */
function endSession(sessionId) {
    if (sessionStore.has(sessionId)) {
        sessionStore.delete(sessionId);
        console.log(`[SessionManager] Ended session: ${sessionId}`);
    } else {
        console.warn(`[SessionManager] Attempted to end a non-existent session: ${sessionId}`);
    }
}

/**
 * Generates a unique session ID.
 * @returns {string} - A unique session ID.
 */
function generateSessionId() {
    return crypto.randomBytes(16).toString("hex");
}

module.exports = {
    createSession,
    validateSession,
    getSessionUser,
    endSession,
};

// ------------------------------------------------------------------------------
// End of Module: Session Manager
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for session management in NIKI chat.
// ------------------------------------------------------------------------------