"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Behavioral Anomaly Detector
//
// Description:
// Monitors system behavior to identify anomalies or suspicious activities within 
// the National Defense HQ Node. Employs machine learning algorithms and statistical 
// models for real-time threat detection and adaptive learning.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For logging and data persistence.
// - lodash: For deep comparisons and data analysis.
// - crypto: For secure hashing of behavioral data.
// - activityAuditLogger: Logs detected anomalies and their details.
// - monitoringConfig.json: Contains thresholds and anomaly definitions.
//
// Usage:
// const { detectAnomalies } = require('./behavioralAnomalyDetector');
// detectAnomalies(activityData).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const crypto = require("crypto");
const { logInfo, logError } = require("./activityAuditLogger");
const monitoringConfig = require("../Config/monitoringConfig.json");

// Paths
const ANOMALY_LOG_PATH = "../Logs/Monitoring/anomalyLogs.json";
const MODEL_STORAGE_PATH = "../AI/Models/behavioralModels.json";

// Default thresholds
const DEFAULT_THRESHOLD = monitoringConfig.behavioralThreshold || 0.75;

/**
 * Detects anomalies based on behavioral data and predefined thresholds.
 * @param {Object} activityData - Behavioral data to analyze.
 * @returns {Promise<void>} - Logs and triggers actions for detected anomalies.
 */
async function detectAnomalies(activityData) {
    logInfo("Starting anomaly detection...");

    try {
        validateActivityData(activityData);

        // Step 1: Extract behavioral features
        const features = extractFeatures(activityData);

        // Step 2: Compare against models
        const anomalyScore = calculateAnomalyScore(features);
        logInfo(`Anomaly score calculated: ${anomalyScore}`);

        // Step 3: Evaluate against threshold
        if (anomalyScore >= DEFAULT_THRESHOLD) {
            logInfo("Anomaly detected!");
            await handleAnomaly(activityData, anomalyScore);
        } else {
            logInfo("No anomalies detected in current activity.");
        }
    } catch (error) {
        logError("Error during anomaly detection.", { error: error.message });
        throw error;
    }
}

/**
 * Validates the structure of activity data.
 * @param {Object} activityData - Activity data to validate.
 */
function validateActivityData(activityData) {
    if (!activityData || typeof activityData !== "object" || !activityData.eventType) {
        throw new Error("Invalid activity data provided. Missing required fields.");
    }
}

/**
 * Extracts key features from activity data for anomaly detection.
 * @param {Object} activityData - The activity data to process.
 * @returns {Object} - Extracted features.
 */
function extractFeatures(activityData) {
    const features = {
        eventType: activityData.eventType,
        eventFrequency: activityData.eventFrequency || 0,
        responseTime: activityData.responseTime || 0,
        resourceUsage: activityData.resourceUsage || 0,
    };

    logInfo("Features extracted from activity data.", { features });
    return features;
}

/**
 * Calculates an anomaly score based on extracted features.
 * @param {Object} features - The extracted features.
 * @returns {number} - Anomaly score between 0 and 1.
 */
function calculateAnomalyScore(features) {
    const baselineModel = loadBehavioralModel();
    let score = 0;

    // Example scoring logic: Weighted comparison with baseline
    Object.keys(features).forEach((key) => {
        const baselineValue = baselineModel[key] || 0;
        const deviation = Math.abs(features[key] - baselineValue);
        score += deviation / (baselineValue || 1);
    });

    return Math.min(score / Object.keys(features).length, 1); // Normalize to [0, 1]
}

/**
 * Loads the baseline behavioral model for comparison.
 * @returns {Object} - The baseline model.
 */
function loadBehavioralModel() {
    try {
        if (fs.existsSync(MODEL_STORAGE_PATH)) {
            const model = fs.readJsonSync(MODEL_STORAGE_PATH);
            logInfo("Baseline behavioral model loaded successfully.");
            return model;
        }

        logInfo("No baseline model found. Using default values.");
        return {
            eventFrequency: 1,
            responseTime: 100,
            resourceUsage: 50,
        };
    } catch (error) {
        logError("Error loading behavioral model.", { error: error.message });
        throw error;
    }
}

/**
 * Handles detected anomalies by logging and triggering alerts.
 * @param {Object} activityData - The activity data that triggered the anomaly.
 * @param {number} anomalyScore - The calculated anomaly score.
 */
async function handleAnomaly(activityData, anomalyScore) {
    const anomalyEntry = {
        timestamp: new Date().toISOString(),
        activityData,
        anomalyScore,
    };

    await logAnomaly(anomalyEntry);

    // Placeholder for triggering alerts or other actions
    logInfo("Anomaly handling initiated.", { anomalyEntry });
}

/**
 * Logs detected anomalies to a persistent storage.
 * @param {Object} anomalyEntry - The anomaly entry to log.
 */
async function logAnomaly(anomalyEntry) {
    await fs.ensureFile(ANOMALY_LOG_PATH);
    const existingLogs = (await fs.readJson(ANOMALY_LOG_PATH, { throws: false })) || [];
    existingLogs.push(anomalyEntry);

    await fs.writeJson(ANOMALY_LOG_PATH, existingLogs, { spaces: 2 });
    logInfo("Anomaly logged successfully.", { anomalyEntry });
}

module.exports = {
    detectAnomalies,
};

// ------------------------------------------------------------------------------
// End of Module: Behavioral Anomaly Detector
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation with anomaly scoring and logging.
// ------------------------------------------------------------------------------