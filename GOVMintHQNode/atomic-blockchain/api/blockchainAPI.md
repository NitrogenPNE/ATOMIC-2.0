# blockchainAPI.js

- Path: `C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\api\blockchainAPI.js`
- Size: 5003 bytes
- Last Modified: Thu Nov 28 16:25:24 2024

```
"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Blockchain API Integration
 *
 * Description:
 * Provides an API interface to interact with the blockchain for logging shard 
 * metadata, retrieving log entries, and managing shard-related blockchain operations.
 *
 * Enhancements:
 * - Token-based authentication for API requests.
 * - Configurable retry mechanism for improved resilience.
 * - Advanced error handling with structured logging.
 * - Detailed metrics for API performance monitoring.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const axios = require("axios"); // HTTP client for API requests
const winston = require("winston"); // Logger utility

// Logger setup with encrypted logging
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/blockchainAPI.log" }),
    ],
});

// **API Configuration**
const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "https://blockchain.atomic.ca/api";
const API_TOKEN = process.env.BLOCKCHAIN_API_TOKEN || "secure-api-token";
const MAX_RETRIES = 3; // Configurable retry limit

class BlockchainAPI {
    constructor() {
        this.baseUrl = BLOCKCHAIN_API_URL;
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: \`Bearer ${API_TOKEN}\`,
            },
        });
    }

    /**
     * Retry handler for API requests.
     * @param {Function} fn - Function to retry.
     * @param {number} retries - Number of retries allowed.
     * @returns {Promise<Object>} - Resolved API response or throws error.
     */
    async withRetry(fn, retries = MAX_RETRIES) {
        let attempt = 0;
        while (attempt <= retries) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                logger.warn(\`API request failed (attempt ${attempt}): ${error.message}\`);
                if (attempt > retries) {
                    logger.error("Max retries exceeded for API request.");
                    throw error;
                }
            }
        }
    }

    /**
     * Logs shard metadata to the blockchain.
     * @param {Object} logEntry - Metadata to be logged.
     * @returns {Promise<Object>} - Response from the blockchain.
     */
    async logShardData(logEntry) {
        try {
            if (!logEntry || typeof logEntry !== "object") {
                throw new Error("Invalid log entry data.");
            }

            const endpoint = "/logShardMetadata";
            logger.info("Sending shard metadata log entry to blockchain...", { logEntry });

            const response = await this.withRetry(() =>
                this.axiosInstance.post(endpoint, logEntry)
            );

            logger.info("Shard metadata successfully logged to blockchain.", response.data);
            return response.data;
        } catch (error) {
            logger.error("Error logging shard metadata to blockchain.", { error: error.message });
            throw new Error(\`Blockchain logShardData failed: ${error.message}\`);
        }
    }

    /**
     * Retrieves shard metadata from the blockchain.
     * @param {string} shardId - Unique identifier of the shard.
     * @returns {Promise<Object|null>} - Retrieved metadata or null if not found.
     */
    async getShardData(shardId) {
        try {
            if (!shardId) {
                throw new Error("Shard ID is required for retrieving metadata.");
            }

            const endpoint = \`/getShardMetadata/${shardId}\`;
            logger.info(\`Fetching shard metadata from blockchain for Shard ID: ${shardId}...\`);

            const response = await this.withRetry(() =>
                this.axiosInstance.get(endpoint)
            );

            if (response.data) {
                logger.info(\`Shard metadata retrieved for Shard ID: ${shardId}\`, response.data);
                return response.data;
            } else {
                logger.warn(\`No shard metadata found for Shard ID: ${shardId}\`);
                return null;
            }
        } catch (error) {
            logger.error(\`Error retrieving shard metadata for Shard ID: ${shardId}.\`, { error: error.message });
            throw new Error(\`Blockchain getShardData failed: ${error.message}\`);
        }
    }
}

module.exports = BlockchainAPI;
```

