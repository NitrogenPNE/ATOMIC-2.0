"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC SMS Gateway Node - Entry Point
// ------------------------------------------------------------------------------

const path = require("path");
const winston = require("winston");
const { sendSecureSMS } = require("./Services/smsService");
const { initializeCryptoUtils } = require("../../atomic-blockchain/Utilities/quantumCryptoUtils");
const CONFIG_PATH = path.join(__dirname, "Config", "config.json");
const fs = require("fs");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, "Logs", "gateway.log") })
    ]
});

// Configuration Loading
let config;
try {
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        logger.info("Configuration loaded successfully.");
    } else {
        throw new Error(`Configuration file not found at: ${CONFIG_PATH}`);
    }
} catch (error) {
    logger.error("Failed to load configuration:", error.message);
    process.exit(1);
}

// Initialize Cryptographic Utilities
(async () => {
    try {
        await initializeCryptoUtils();
        logger.info("Quantum-resistant cryptographic utilities initialized.");
    } catch (error) {
        logger.error("Failed to initialize cryptographic utilities:", error.message);
        process.exit(1);
    }
})();

// Simulate SMS Gateway Test
(async () => {
    try {
        const recipientTokenId = "43c6f029-1eeb-40ce-8bb6-77d57cb861a3"; // Example token ID
        const senderTokenId = "91edb17f-9082-4aef-8ea8-5e98a74fca45"; // Example sender token ID
        const encryptedToken = "dGVzdC1lbmNyeXB0ZWQtdG9rZW4="; // Example encrypted token
        const message = "Welcome to ATOMIC HQ Node Communication Services!";

        const result = await sendSecureSMS(recipientTokenId, message, senderTokenId, encryptedToken);
        if (result.success) {
            logger.info("Test SMS sent successfully.", { data: result.data });
        } else {
            logger.error("Failed to send test SMS.", { error: result.error });
        }
    } catch (error) {
        logger.error("Error during SMS gateway test:", error.message);
    }
})();