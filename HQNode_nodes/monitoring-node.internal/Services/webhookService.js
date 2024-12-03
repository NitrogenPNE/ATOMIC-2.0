"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Monitoring Node Webhook Service
// ------------------------------------------------------------------------------

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/webhook.log" })
    ]
});

// Key Management
const API_KEY_FILE = path.join(__dirname, "../Config/webhook_api_key.txt");

/**
 * Generate or retrieve the secure API key.
 * If the key doesn't exist, generate one and save it.
 * @returns {string} - The secure API key.
 */
function getOrCreateAPIKey() {
    if (fs.existsSync(API_KEY_FILE)) {
        return fs.readFileSync(API_KEY_FILE, "utf8").trim();
    }

    const newKey = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(API_KEY_FILE, newKey);
    logger.info("Generated and stored a new API key.");
    return newKey;
}

// Retrieve API Key
const API_KEY = getOrCreateAPIKey();

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Webhook endpoint
app.post("/webhook", (req, res) => {
    const authKey = req.headers["x-api-key"];
    if (authKey !== API_KEY) {
        logger.warn("Unauthorized webhook attempt detected.");
        return res.status(403).json({ error: "Unauthorized" });
    }

    const event = req.body;
    logger.info("Received webhook event:", event);

    // Process the event (e.g., log it, trigger alerts, etc.)
    res.status(200).json({ message: "Webhook received and processed." });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// Start the webhook service
function startWebhookService() {
    const PORT = process.env.PORT || 8080; // Internal port
    app.listen(PORT, () => {
        logger.info(`Webhook service running on port ${PORT}`);
        logger.info(`API Key: ${API_KEY}`);
    });
}

module.exports = { startWebhookService };