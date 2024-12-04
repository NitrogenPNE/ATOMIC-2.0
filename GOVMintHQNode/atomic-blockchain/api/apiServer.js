"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Enhanced API Server
 *
 * Description:
 * Provides a RESTful API interface for interacting with the ATOMIC blockchain,
 * enhanced with robust security, scalability, and monitoring features.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const promBundle = require("express-prom-bundle"); // For Prometheus metrics
const winston = require("winston");
const { getBlockByHash, getLatestBlock, getTransactions, submitTransaction } = require("../core/blockchainNode");
const { validateTransaction } = require("../utils/validationUtils");
const { validateApiKeyWithRole } = require("../utils/authUtils");
const { encryptLog } = require("../utils/loggingUtils");

// Environment Variables
const API_TOKEN = process.env.API_TOKEN || "secure-api-token";
const ALLOWED_IPS = (process.env.ALLOWED_IPS || "").split(",").filter((ip) => ip);

// Initialize Express
const app = express();
const PORT = process.env.API_PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Prometheus Metrics Middleware
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true });
app.use(metricsMiddleware);

// Logger Setup with Encrypted Logging
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `[${timestamp}] [${level.toUpperCase()}]: ${encryptLog(message)} ${Object.keys(meta).length ? JSON.stringify(meta) : ""
                }`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/encryptedApiServer.log" }),
    ],
});

// **Dynamic Rate Limiting Middleware**
const rateLimiter = (maxRequests) =>
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: maxRequests,
    });

// **Custom Middleware: Authentication with Role-Based Access**
app.use(async (req, res, next) => {
    const token = req.headers["authorization"];
    const clientIp = req.ip;

    try {
        const role = await validateApiKeyWithRole(token, clientIp);

        if (!role) {
            logger.warn(`Unauthorized access attempt from IP: ${clientIp}`);
            return res.status(403).json({ error: "Unauthorized: Access denied." });
        }

        req.userRole = role;

        // Apply rate limiting based on role
        const maxRequests = role === "admin" ? 1000 : role === "operator" ? 500 : 100;
        app.use(rateLimiter(maxRequests));
        next();
    } catch (error) {
        logger.error("Authentication error:", error.message);
        return res.status(403).json({ error: "Unauthorized access." });
    }
});

// **Enhanced Routes**
/**
 * GET /blocks/latest
 * Retrieves the latest block in the blockchain.
 */
app.get("/blocks/latest", async (req, res) => {
    try {
        logger.info("Fetching the latest block...");
        const block = await getLatestBlock();
        res.status(200).json(block);
    } catch (error) {
        logger.error("Error fetching the latest block:", error.message);
        res.status(500).json({ error: "Failed to retrieve the latest block." });
    }
});

/**
 * GET /blocks
 * Retrieves blocks with optional pagination.
 */
app.get("/blocks", async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        logger.info(`Fetching blocks: page=${page}, limit=${limit}`);
        const blocks = await getBlocks(page, limit); // Implement pagination in your core module
        res.status(200).json(blocks);
    } catch (error) {
        logger.error("Error fetching blocks:", error.message);
        res.status(500).json({ error: "Failed to retrieve blocks." });
    }
});

/**
 * GET /transactions
 * Retrieves transactions with filtering options.
 */
app.get("/transactions", async (req, res) => {
    const { from, to, date } = req.query;
    try {
        logger.info(`Fetching transactions with filters: from=${from}, to=${to}, date=${date}`);
        const transactions = await getTransactions({ from, to, date }); // Add filtering logic
        res.status(200).json(transactions);
    } catch (error) {
        logger.error("Error fetching transactions:", error.message);
        res.status(500).json({ error: "Failed to retrieve transactions." });
    }
});

/**
 * GET /metrics/atomic
 * Retrieves custom atomic-level metrics.
 */
app.get("/metrics/atomic", (req, res) => {
    const atomicMetrics = {
        shardBounceRate: 0.05, // Example placeholder
        activeNodes: 100,
        averageLatencyMs: 120,
    };
    res.status(200).json(atomicMetrics);
});

/**
 * GET /health
 * Health check endpoint.
 */
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// **Error Handling**
app.use((err, req, res, next) => {
    if (err.code === "BLOCK_NOT_FOUND") {
        logger.warn("Block not found error:", err.message);
        return res.status(404).json({ error: "Block not found." });
    }
    if (err.code === "TRANSACTION_INVALID") {
        logger.warn("Invalid transaction error:", err.message);
        return res.status(400).json({ error: "Invalid transaction." });
    }
    logger.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal Server Error." });
});

// **Start the Server**
app.listen(PORT, () => {
    logger.info(`ATOMIC Blockchain API Server is running on port ${PORT}`);
});

module.exports = app;
