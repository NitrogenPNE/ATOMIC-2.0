"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Enhanced Data and Node Classification Logic
 *
 * Description:
 * Classifies input data and nodes into actionable atomic structures.
 * Supports distributed shard and node management with detailed data type tagging.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const config = require("../config/config");
const ClassifierLogicContract = require("../../../../SmartContracts/Data/classifierLogic/classifierLogicContract");
const { validateNodePerformance, assignShardToNode } = require("../../../../Utilities/shardNodeCommunicator");
const { allocateShards } = require("../../../Sharding/shardAllocator");
const { shardDataIntoBits } = require("../../../Sharding/bitSharder");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "classification.log" }),
    ],
});

// Instantiate the contract
const classifierLogicContract = new ClassifierLogicContract();

/**
 * Classify and shard data or nodes based on operational context.
 */
async function classifierLogicWithContract(data, filePath = null, entityId, isNode = false) {
    try {
        logger.info(`Starting classification for ${isNode ? "Node" : "Data/Entity"}: ${entityId}`);

        if (isNode) {
            // Node-specific classification and sharding
            const nodeClassification = await classifyAndShardNode(entityId);
            logger.info("Node classification and sharding completed.", { nodeClassification });
            return nodeClassification;
        } else {
            // Data-specific classification and sharding
            const inputType = detectType(data, filePath);
            logger.info(`Detected data type: ${inputType}`);

            const proposal = classifierLogicContract.createClassificationProposal(entityId, inputType);
            const classification = await performClassification(data, filePath, inputType);

            // Shard data into bit atoms
            const shardResult = await shardDataIntoBits(
                classification.type,
                entityId,
                data,
                entityId,
                "encrypted-token"
            );
            logger.info("Data classification and sharding completed.", { shardResult });

            const result = await classifierLogicContract.executeClassification(proposal, classification);
            logger.info("Data classification contract executed.", { result });
            return { result, shardResult };
        }
    } catch (error) {
        logger.error("Error during classification and sharding:", { message: error.message });
        throw error;
    }
}

/**
 * Perform node classification and allocate shards.
 */
async function classifyAndShardNode(nodeId) {
    logger.info(`Classifying and sharding Node: ${nodeId}`);

    // Step 1: Validate node performance
    const performanceMetrics = await validateNodePerformance(nodeId);
    if (!performanceMetrics.isOperational) {
        throw new Error(`Node ${nodeId} is not operational and cannot be classified.`);
    }

    // Step 2: Classify node
    const classification = {
        nodeId,
        isOperational: performanceMetrics.isOperational,
        latency: performanceMetrics.latency,
        shardThroughput: performanceMetrics.shardThroughput,
        operationalRole: performanceMetrics.operationalRole,
    };

    logger.info("Node Classification Details:", { classification });

    // Step 3: Allocate shards to the node
    const allocatedShards = await allocateShards(nodeId, "token-id", "encrypted-token");
    logger.info("Shards allocated to Node.", { allocatedShards });

    return { classification, allocatedShards };
}

/**
 * Detect the type of the data based on file extension and content.
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

    if (filePath) {
        const extension = path.extname(filePath).toLowerCase();
        if (militaryTypeMap[extension]) return militaryTypeMap[extension];
        return generalTypeMap[extension] || "unknown";
    }

    if (!filePath && typeof data === "object" && !Buffer.isBuffer(data)) {
        return "structured"; // JSON or in-memory object
    }

    if (typeof data === "string") return "text";
    if (Buffer.isBuffer(data)) return "binary";

    return "unknown";
}

/**
 * Perform the classification logic for data based on size and type.
 */
async function performClassification(data, filePath, detectedType) {
    const dataSizeKB = await calculateSizeInKB(data, filePath);
    const largeFileSizeKB = config.classificationThreshold || 1024;

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
 * Calculate the size of data in KB.
 */
async function calculateSizeInKB(data, filePath) {
    if (filePath) {
        const stat = await fs.promises.stat(filePath);
        return stat.size / 1024;
    }
    return Buffer.byteLength(JSON.stringify(data)) / 1024;
}

// Export the classifier logic function
module.exports = {
    classifierLogic: classifierLogicWithContract,
};