/**
 * @file addressIssuer.js
 * @description Responsible for generating and managing unique subscription addresses for clients
 * and corporate entities in the ATOMIC CorporateHQNode.
 * 
 * @author ATOMIC Development Team
 */

// Dependencies
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Configuration
const addressStoragePath = "C:\\ATOMIC 2.0\\CorporateHQNode\\Subscriptions\\Addresses";
const logFilePath = "C:\\ATOMIC 2.0\\CorporateHQNode\\Subscriptions\\addressIssuer.log";

// Ensure directories exist
if (!fs.existsSync(addressStoragePath)) {
    fs.mkdirSync(addressStoragePath, { recursive: true });
    logEvent("Created directory for address storage.");
}

/**
 * Logs events to the log file.
 * @param {string} message - The message to log.
 * @param {string} level - Log level (INFO, WARN, ERROR).
 */
function logEvent(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
    console.log(logMessage.trim());
}

/**
 * Generates a unique subscription address using SHA-256.
 * @param {string} entityId - The ID of the entity requesting the address.
 * @returns {string} - The generated subscription address.
 */
function generateAddress(entityId) {
    try {
        logEvent(`Generating address for entity ID: ${entityId}`);
        const hash = crypto.createHash("sha256");
        const timestamp = Date.now().toString();
        hash.update(entityId + timestamp);
        const address = hash.digest("hex");
        logEvent(`Generated address: ${address}`);
        return address;
    } catch (error) {
        logEvent(`Error generating address: ${error.message}`, "ERROR");
        throw error;
    }
}

/**
 * Stores the generated address in the address storage directory.
 * @param {string} entityId - The ID of the entity.
 * @param {string} address - The generated address.
 */
function storeAddress(entityId, address) {
    try {
        logEvent(`Storing address for entity ID: ${entityId}`);
        const filePath = path.join(addressStoragePath, `${entityId}.json`);
        const addressData = { entityId, address, issuedAt: new Date().toISOString() };
        fs.writeFileSync(filePath, JSON.stringify(addressData, null, 4), "utf8");
        logEvent(`Address stored successfully at: ${filePath}`);
    } catch (error) {
        logEvent(`Error storing address: ${error.message}`, "ERROR");
        throw error;
    }
}

/**
 * Issues a new subscription address for a given entity ID.
 * @param {string} entityId - The ID of the entity requesting a subscription address.
 * @returns {string} - The issued address.
 */
function issueAddress(entityId) {
    try {
        logEvent(`Issuing address for entity ID: ${entityId}`);
        const address = generateAddress(entityId);
        storeAddress(entityId, address);
        return address;
    } catch (error) {
        logEvent(`Error issuing address: ${error.message}`, "ERROR");
        throw error;
    }
}

// Example usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log("Usage: node addressIssuer.js <EntityID>");
        process.exit(1);
    }

    const entityId = args[0];
    try {
        const address = issueAddress(entityId);
        console.log(`Successfully issued address: ${address}`);
    } catch (error) {
        console.error("Failed to issue address:", error.message);
    }
}

module.exports = {
    generateAddress,
    storeAddress,
    issueAddress,
};
