"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Shard Validator
//
// Description:
// This module validates shards within the ATOMIC decentralized storage system.
// It ensures the integrity, structure, and dependencies of all shards, adhering
// to the schema and security policies defined for the National Defense HQ Node.
//
// Features:
// - Validates shard structure based on the defined schema.
// - Performs hash integrity checks to ensure data consistency.
// - Verifies shard dependencies for compliance with network standards.
// - Logs all validation results for auditing and compliance.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configuration
const BASE_DIR = path.resolve(__dirname, "../"); // Two levels up from the current script
const LOG_DIR = path.join(BASE_DIR, "Logs");
const SHARD_STORAGE = path.join(BASE_DIR, "Data", "Shards");
const SHARD_SCHEMA_PATH = path.join(BASE_DIR, "Config", "shardSchema.json");

// Logging utility
function logMessage(message, level = "INFO") {
    const logFile = path.join(LOG_DIR, "shardValidation.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(logFile, logEntry, "utf8");
    console.log(logEntry);
}

// Load Shard Schema
function loadShardSchema() {
    try {
        const schema = JSON.parse(fs.readFileSync(SHARD_SCHEMA_PATH, "utf8"));
        logMessage("[INFO] Shard schema loaded successfully.");
        return schema;
    } catch (error) {
        logMessage(`[ERROR] Failed to load shard schema: ${error.message}`, "ERROR");
        throw error;
    }
}

// Validate Shard Against Schema
function validateShardStructure(shard, schema) {
    for (const field in schema) {
        if (!shard.hasOwnProperty(field)) {
            return `Missing required field: ${field}`;
        }
        if (typeof shard[field] !== schema[field].type) {
            return `Invalid type for field "${field}". Expected ${schema[field].type}.`;
        }
    }
    return null;
}

// Hash Validation
function validateShardHash(shard) {
    const computedHash = crypto.createHash("sha256").update(shard.data).digest("hex");
    if (computedHash !== shard.hash) {
        return `Hash mismatch for shard ID ${shard.id}: expected ${shard.hash}, computed ${computedHash}`;
    }
    return null;
}

// Dependency Validation
function validateShardDependencies(shard, availableShards) {
    if (shard.dependencies) {
        for (const dependency of shard.dependencies) {
            if (!availableShards.includes(dependency)) {
                return `Missing dependency: ${dependency}`;
            }
        }
    }
    return null;
}

// Validate a Single Shard
function validateShard(shard, schema, availableShards) {
    const errors = [];

    // Validate structure
    const structureError = validateShardStructure(shard, schema);
    if (structureError) errors.push(structureError);

    // Validate hash
    const hashError = validateShardHash(shard);
    if (hashError) errors.push(hashError);

    // Validate dependencies
    const dependencyError = validateShardDependencies(shard, availableShards);
    if (dependencyError) errors.push(dependencyError);

    return errors.length > 0 ? errors : null;
}

// Main Shard Validation Function
function validateAllShards() {
    logMessage("[INFO] Starting shard validation...");

    // Ensure shard storage directory exists
    if (!fs.existsSync(SHARD_STORAGE)) {
        logMessage(`[ERROR] Shard storage directory not found: ${SHARD_STORAGE}`, "ERROR");
        return;
    }

    // Load shard schema
    const schema = loadShardSchema();

    // List all shards in the storage directory
    const shardFiles = fs.readdirSync(SHARD_STORAGE).filter(file => file.endsWith(".json"));
    const availableShards = shardFiles.map(file => path.basename(file, ".json"));

    const validationResults = [];
    for (const file of shardFiles) {
        const filePath = path.join(SHARD_STORAGE, file);

        try {
            const shard = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const errors = validateShard(shard, schema, availableShards);

            if (errors) {
                logMessage(`[ERROR] Validation failed for shard ${file}: ${errors.join("; ")}`, "ERROR");
                validationResults.push({ shard: file, status: "invalid", errors });
            } else {
                logMessage(`[INFO] Shard ${file} validated successfully.`);
                validationResults.push({ shard: file, status: "valid" });
            }
        } catch (error) {
            logMessage(`[ERROR] Error validating shard ${file}: ${error.message}`, "ERROR");
            validationResults.push({ shard: file, status: "error", errors: [error.message] });
        }
    }

    // Save validation results
    const resultsPath = path.join(LOG_DIR, "shardValidationResults.json");
    fs.writeFileSync(resultsPath, JSON.stringify(validationResults, null, 4), "utf8");
    logMessage(`[INFO] Shard validation results saved to: ${resultsPath}`);
    logMessage("[INFO] Shard validation completed.");
}

// Execute if run directly
if (require.main === module) {
    try {
        validateAllShards();
    } catch (error) {
        logMessage(`[ERROR] Unexpected error during shard validation: ${error.message}`, "ERROR");
    }
}

module.exports = {
    validateAllShards,
    validateShard,
    validateShardStructure,
    validateShardHash,
    validateShardDependencies
};