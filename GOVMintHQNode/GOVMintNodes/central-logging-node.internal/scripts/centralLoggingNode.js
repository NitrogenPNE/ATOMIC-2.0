"use strict";

/**
 * Central Logging Node
 * Handles local log aggregation and provides an endpoint for log ingestion.
 * Dependencies: Express.js
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 9000; // Default port for the logging node
const LOG_FILE_PATH = path.resolve(__dirname, "../logs/central-logs.json");

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to receive logs
app.post("/logs", (req, res) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...req.body,
    };

    try {
        // Append log entry to the log file
        if (!fs.existsSync(LOG_FILE_PATH)) {
            fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([logEntry], null, 2));
        } else {
            const logs = JSON.parse(fs.readFileSync(LOG_FILE_PATH, "utf8"));
            logs.push(logEntry);
            fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
        }

        console.log("Log received and stored:", logEntry);
        res.status(200).send({ status: "success", message: "Log stored successfully." });
    } catch (error) {
        console.error("Error storing log:", error);
        res.status(500).send({ status: "error", message: "Failed to store log." });
    }
});

// Start the logging node server
app.listen(PORT, () => {
    console.log(Central Logging Node running on port );
});
