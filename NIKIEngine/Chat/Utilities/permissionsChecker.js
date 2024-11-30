"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Permissions Checker
//
// Description:
// Validates user permissions and role-based access control (RBAC) for executing
// specific commands or accessing sensitive data through the NIKI chat interface.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// **Paths**
const USER_ROLES_PATH = path.resolve(__dirname, "../Config/userRoles.json");
const ACCESS_CONTROL_PATH = path.resolve(__dirname, "../Config/accessControl.json");

/**
 * Loads the user roles configuration.
 * @returns {Promise<Object>} - User roles mapping.
 */
async function loadUserRoles() {
    try {
        const roles = await fs.readJson(USER_ROLES_PATH);
        console.log("[PermissionsChecker] User roles loaded successfully.");
        return roles;
    } catch (error) {
        console.error(`[PermissionsChecker] Failed to load user roles: ${error.message}`);
        throw new Error("Could not load user roles configuration.");
    }
}

/**
 * Loads the access control configuration.
 * @returns {Promise<Object>} - Access control rules.
 */
async function loadAccessControl() {
    try {
        const accessControl = await fs.readJson(ACCESS_CONTROL_PATH);
        console.log("[PermissionsChecker] Access control rules loaded successfully.");
        return accessControl;
    } catch (error) {
        console.error(`[PermissionsChecker] Failed to load access control: ${error.message}`);
        throw new Error("Could not load access control configuration.");
    }
}

/**
 * Validates if a user has permission to execute a command or access a resource.
 * @param {string} userId - The user's unique identifier.
 * @param {string} command - The command or resource being accessed.
 * @returns {Promise<boolean>} - True if the user has permission; false otherwise.
 */
async function hasPermission(userId, command) {
    const userRoles = await loadUserRoles();
    const accessControl = await loadAccessControl();

    const userRole = userRoles[userId] || "guest";
    const allowedRoles = accessControl[command]?.roles || [];

    console.log(`[PermissionsChecker] Checking permissions for User ID: ${userId}, Role: ${userRole}, Command: ${command}`);
    return allowedRoles.includes(userRole);
}

/**
 * Middleware to enforce permissions in chat interactions.
 * @param {string} userId - The user's unique identifier.
 * @param {string} command - The command or resource being accessed.
 * @param {Function} next - The next function to execute if permission is granted.
 * @returns {Promise<void>} - Resolves if permission is granted; rejects otherwise.
 */
async function enforcePermissions(userId, command, next) {
    if (await hasPermission(userId, command)) {
        console.log(`[PermissionsChecker] Permission granted for User ID: ${userId}, Command: ${command}`);
        return next();
    } else {
        console.error(`[PermissionsChecker] Permission denied for User ID: ${userId}, Command: ${command}`);
        throw new Error(`Permission denied for command: ${command}`);
    }
}

module.exports = {
    hasPermission,
    enforcePermissions,
};

// ------------------------------------------------------------------------------
// End of Module: Permissions Checker
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for permissions checking.
// ------------------------------------------------------------------------------