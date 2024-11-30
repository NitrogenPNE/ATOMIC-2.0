"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Data Classification Logic
//
// Description:
// Classifies input data into actionable atomic structures.
// Supports military-specific classifications alongside general file types.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const winston = require("winston");
const config = require("../config/config"); // Adjust this path based on your structure
const ClassifierLogicContract = require("../../../../SmartContracts/Data/classifierLogic/classifierLogicContract"); // Ensure correct path

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "error.log", level: "error" }),
    ],
});

// Instantiate the contract
const classifierLogicContract = new ClassifierLogicContract();

/**
 * Classify data based on its type and size using the contract.
 */
async function classifierLogicWithContract(data, filePath = null, userId) {
    try {
        logger.info(`Starting classification for User ID: ${userId}`);

        // Step 1: Detect Type and Create Classification Proposal
        const inputType = detectType(data, filePath);
        logger.info(`Detected data type: ${inputType}`);

        const proposal = classifierLogicContract.createClassificationProposal(userId, inputType);

        // Step 2: Perform Classification
        const classification = await performClassification(data, filePath, inputType);

        // Step 3: Execute Classification via Contract
        const result = await classifierLogicContract.executeClassification(proposal, classification);

        logger.info("Classification complete.", { result });
        return result;
    } catch (error) {
        logger.error("Error during classification with contract:", { message: error.message });
        throw error;
    }
}

/**
 * Perform the classification logic.
 * Includes tagging military-specific data for real-time shard processing.
 */
async function performClassification(data, filePath, detectedType) {
    const dataSizeKB = await calculateSizeInKB(data, filePath);
    const largeFileSizeKB = config.classificationThreshold || 1024; // Default threshold: 1024 KB

    const militarySpecificTypes = [
        "satellite image",
        "geospatial data",
        "signals intelligence",
        "imagery intelligence",
        "electronic intelligence",
        "operation order",
        "fragmentary order",
    ];

    const isMilitarySpecific = militarySpecificTypes.includes(detectedType);

    const classification = {
        type: detectedType,
        sizeKB: dataSizeKB,
        isLarge: dataSizeKB >= largeFileSizeKB,
        isMilitarySpecific,
    };

    logger.info("Data Classification Details:", { classification });
    return classification;
}

/**
 * Detect the type of the data based on file extension and content.
 * Integrates military-specific and general types.
 */
function detectType(data, filePath) {
    const militaryTypeMap = {
        ".tif": "satellite image",
        ".geojson": "geospatial data",
        ".kml": "geospatial data",
        ".sigint": "signals intelligence",
        ".imint": "imagery intelligence",
        ".elint": "electronic intelligence",
        ".opord": "operation order",
        ".frago": "fragmentary order",
    };

    const generalTypeMap = {
        ".jpg": "image", ".jpeg": "image", ".png": "image", ".gif": "image",
        ".bmp": "image", ".tiff": "image", ".webp": "image", ".mp4": "video",
        ".avi": "video", ".mkv": "video", ".mov": "video", ".mp3": "audio",
        ".wav": "audio", ".ogg": "audio", ".flac": "audio", ".aac": "audio",
        ".m4a": "audio", ".pdf": "pdf", ".txt": "text", ".doc": "document",
        ".docx": "document", ".xls": "spreadsheet", ".xlsx": "spreadsheet",
        ".ppt": "presentation", ".pptx": "presentation", ".json": "structured",
        ".xml": "structured", ".yaml": "structured", ".yml": "structured",
        ".zip": "archive", ".rar": "archive", ".tar": "archive", ".gz": "archive",
        ".7z": "archive", ".html": "web", ".htm": "web", ".css": "stylesheet",
        ".js": "script", ".exe": "executable", ".bin": "executable",
        ".msi": "executable", ".ttf": "font", ".otf": "font", ".woff": "font",
        ".woff2": "font", ".svg": "vector graphic", ".ico": "icon",
        ".md": "markdown", ".csv": "spreadsheet", ".fbx": "3D model",
        ".glb": "3D model", ".epub": "eBook", ".mobi": "eBook",
        ".bz2": "archive", ".lz": "archive", ".markdown": "markdown"
    };

    // Step 1: Detect for in-memory or string data
    if (!filePath && typeof data === "object" && !Buffer.isBuffer(data)) {
        return "structured"; // JSON or in-memory object
    }

    if (typeof data === "string") return "text";
    if (Buffer.isBuffer(data)) return "binary";

    // Step 2: File-based detection
    if (filePath) {
        const extension = path.extname(filePath).toLowerCase();

        // Military takes priority if matched
        if (militaryTypeMap[extension]) return militaryTypeMap[extension];
        return generalTypeMap[extension] || "unknown";
    }

    return "unknown";
}

/**
 * Calculate the size of data in KB (for both files and in-memory data).
 */
async function calculateSizeInKB(data, filePath) {
    if (filePath) {
        try {
            const stat = await fs.promises.stat(filePath);
            return stat.size / 1024; // Size in KB
        } catch (error) {
            logger.error(`Error accessing file at ${filePath}: ${error.message}`);
            throw new Error(`Error accessing file at ${filePath}: ${error.message}`);
        }
    }

    const serializedData = JSON.stringify(data);
    return Buffer.byteLength(serializedData) / 1024;
}

// Export the classifier logic function with contract integration.
module.exports = {
    classifierLogic: classifierLogicWithContract,
};