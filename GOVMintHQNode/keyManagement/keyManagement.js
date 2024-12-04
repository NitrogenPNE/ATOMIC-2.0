"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: GOVMintHQNode Key Management System
 *
 * Description:
 * A decentralized key management module designed to integrate with the
 * HQNode Key Management System for centralized control and secure rotation.
 *
 * Author: ATOMIC Development Team
 * ------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

// Paths for local key storage
const KEYS_DIRECTORY = path.resolve(__dirname, "keys");
const ACTIVE_KEY_FILE = path.join(KEYS_DIRECTORY, "activeKey.json");
const ROTATION_LOG_FILE = path.join(KEYS_DIRECTORY, "rotationLog.json");

// HQNode Key Management Integration
const HQ_KEY_MANAGEMENT_PATH = "../../HQNode/keyManagement/keyManagement.js";
const HQKeyManagement = require(HQ_KEY_MANAGEMENT_PATH);

/**
 * Initializes the key management system by syncing with HQNode if needed.
 */
async function initializeKeyManagement() {
    await fs.ensureDir(KEYS_DIRECTORY);

    // Sync with HQNode Key Management System
    console.log("Syncing with HQNode for active key...");
    const activeKey = await HQKeyManagement.getActiveKey();
    await setActiveKey(activeKey);

    if (!(await fs.pathExists(ROTATION_LOG_FILE))) {
        await fs.writeJson(ROTATION_LOG_FILE, { rotations: [] }, { spaces: 2 });
        console.log("Initialized key rotation log.");
    }
}

/**
 * Retrieves the currently active key from the local storage.
 * @returns {Promise<Object>} - The active key and its metadata.
 */
async function getActiveKey() {
    try {
        if (!(await fs.pathExists(ACTIVE_KEY_FILE))) {
            console.log("Local active key missing. Syncing from HQNode...");
            const activeKey = await HQKeyManagement.getActiveKey();
            await setActiveKey(activeKey);
            return activeKey;
        }

        const activeKey = await fs.readJson(ACTIVE_KEY_FILE);
        console.log(`Retrieved active key with ID: ${activeKey.keyId}`);
        return activeKey;
    } catch (error) {
        console.error("Error retrieving active key:", error.message);
        throw error;
    }
}

/**
 * Sets the given key as the active key in the local system.
 * @param {Object} key - The key object to set as active.
 * @returns {Promise<void>}
 */
async function setActiveKey(key) {
    try {
        await fs.writeJson(ACTIVE_KEY_FILE, key, { spaces: 2 });
        console.log(`Set new active key locally with ID: ${key.keyId}`);
    } catch (error) {
        console.error("Error setting local active key:", error.message);
        throw error;
    }
}

/**
 * Logs key access for auditing purposes locally and syncs with HQNode.
 * @param {Object} key - The key object being accessed.
 * @returns {Promise<void>}
 */
async function logKeyAccess(key) {
    try {
        const logEntry = {
            keyId: key.keyId,
            accessedAt: new Date().toISOString(),
        };

        const rotationLog = await fs.readJson(ROTATION_LOG_FILE);
        rotationLog.rotations.push(logEntry);

        await fs.writeJson(ROTATION_LOG_FILE, rotationLog, { spaces: 2 });
        console.log(`Logged key access locally for key ID: ${key.keyId}`);

        // Sync with HQNode
        await HQKeyManagement.logKeyAccess(key);
    } catch (error) {
        console.error("Error logging key access:", error.message);
        throw error;
    }
}

/**
 * Rotates the current active key by requesting HQNode to handle rotation.
 * @returns {Promise<Object>} - The newly rotated key from HQNode.
 */
async function rotateKey() {
    try {
        console.log("Requesting key rotation from HQNode...");
        const newKey = await HQKeyManagement.rotateKey();
        await setActiveKey(newKey);
        console.log(`Key rotation completed locally. New key ID: ${newKey.keyId}`);
        return newKey;
    } catch (error) {
        console.error("Error rotating key:", error.message);
        throw error;
    }
}

module.exports = {
    initializeKeyManagement,
    getActiveKey,
    setActiveKey,
    rotateKey,
    logKeyAccess,
};

// ------------------------------------------------------------------------------
// End of Module: GOVMintHQNode Key Management System
// Version: 1.0.0 | Updated: 2024-12-03
// ------------------------------------------------------------------------------

// Initialize Key Management System if run directly
if (require.main === module) {
    (async () => {
        try {
            await initializeKeyManagement();
            const activeKey = await getActiveKey();
            console.log("Current Active Key:", activeKey);
        } catch (error) {
            console.error("Critical error initializing key management:", error.message);
        }
    })();
}
