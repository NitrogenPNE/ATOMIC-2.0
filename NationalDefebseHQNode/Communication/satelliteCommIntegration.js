"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Satellite Communication Integration
//
// Description:
// Manages communication between the National Defense HQ Node and satellite nodes.
// Handles secure uplink and downlink transmissions, redundancy, and fault tolerance.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For configuration and log management.
// - path: For resolving communication logs and configurations.
// - crypto: For secure encryption of data.
// - satelliteProtocolManager: Custom library for satellite communication protocols.
// - monitoring: Logs and monitors satellite communication performance.
//
// Usage:
// const { establishConnection, sendMessage, receiveMessage } = require('./satelliteCommIntegration');
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const satelliteProtocolManager = require("./satelliteProtocolManager");

// Configuration and Log Paths
const SATELLITE_CONFIG_PATH = path.resolve(__dirname, "../Config/satelliteConfig.json");
const COMMUNICATION_LOG_PATH = path.resolve(__dirname, "../Logs/Communication/satelliteCommLogs.json");

/**
 * Establishes a secure connection with the satellite.
 * @param {string} satelliteId - The ID of the satellite to connect to.
 * @returns {Promise<boolean>} - Returns true if the connection is successful.
 */
async function establishConnection(satelliteId) {
    logInfo(`Attempting to establish connection with satellite: ${satelliteId}`);

    try {
        const config = await fs.readJson(SATELLITE_CONFIG_PATH);

        // Validate satellite ID
        if (!config.satellites.includes(satelliteId)) {
            throw new Error(`Satellite ID ${satelliteId} not recognized.`);
        }

        const connectionResult = await satelliteProtocolManager.connect(satelliteId);
        logInfo(`Connection established with satellite: ${satelliteId}`);
        return connectionResult;
    } catch (error) {
        logError(`Failed to establish connection with satellite: ${satelliteId}`, { error: error.message });
        return false;
    }
}

/**
 * Sends a secure message to the satellite.
 * @param {string} satelliteId - The ID of the target satellite.
 * @param {string} message - The message payload.
 * @returns {Promise<boolean>} - Returns true if the message is sent successfully.
 */
async function sendMessage(satelliteId, message) {
    logInfo(`Sending message to satellite: ${satelliteId}`);

    try {
        const encryptedMessage = encryptMessage(message);
        await satelliteProtocolManager.send(satelliteId, encryptedMessage);

        logCommunication({ satelliteId, direction: "uplink", message });
        logInfo(`Message sent successfully to satellite: ${satelliteId}`);
        return true;
    } catch (error) {
        logError(`Failed to send message to satellite: ${satelliteId}`, { error: error.message });
        return false;
    }
}

/**
 * Receives a secure message from the satellite.
 * @param {string} satelliteId - The ID of the source satellite.
 * @returns {Promise<string>} - Returns the decrypted message.
 */
async function receiveMessage(satelliteId) {
    logInfo(`Receiving message from satellite: ${satelliteId}`);

    try {
        const encryptedMessage = await satelliteProtocolManager.receive(satelliteId);
        const message = decryptMessage(encryptedMessage);

        logCommunication({ satelliteId, direction: "downlink", message });
        logInfo(`Message received successfully from satellite: ${satelliteId}`);
        return message;
    } catch (error) {
        logError(`Failed to receive message from satellite: ${satelliteId}`, { error: error.message });
        throw error;
    }
}

/**
 * Encrypts a message for secure transmission.
 * @param {string} message - The plaintext message.
 * @returns {string} - The encrypted message.
 */
function encryptMessage(message) {
    const cipher = crypto.createCipher("aes-256-gcm", "encryption-key"); // Replace with a secure key management system
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

/**
 * Decrypts a received message.
 * @param {string} encryptedMessage - The encrypted message.
 * @returns {string} - The decrypted message.
 */
function decryptMessage(encryptedMessage) {
    const decipher = crypto.createDecipher("aes-256-gcm", "encryption-key"); // Replace with a secure key management system
    let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

/**
 * Logs communication details to the satellite communication log file.
 * @param {Object} logEntry - Details of the communication (e.g., satelliteId, message, direction).
 */
async function logCommunication(logEntry) {
    try {
        await fs.ensureFile(COMMUNICATION_LOG_PATH);
        const existingLogs = (await fs.readJson(COMMUNICATION_LOG_PATH, { throws: false })) || [];
        existingLogs.push({ timestamp: new Date().toISOString(), ...logEntry });
        await fs.writeJson(COMMUNICATION_LOG_PATH, existingLogs, { spaces: 2 });

        logInfo("Communication logged successfully.");
    } catch (error) {
        logError("Failed to log communication.", { error: error.message });
    }
}

module.exports = {
    establishConnection,
    sendMessage,
    receiveMessage,
};

// ------------------------------------------------------------------------------
// End of Module: Satellite Communication Integration
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log:
// - Initial implementation for satellite communication.
// ------------------------------------------------------------------------------