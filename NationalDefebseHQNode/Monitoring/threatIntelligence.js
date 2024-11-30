"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Threat Intelligence
//
// Description:
// Aggregates, processes, and disseminates threat intelligence data within the 
// National Defense HQ Node. Integrates with external threat feeds, monitoring
// systems, and predictive analysis to provide actionable insights.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - axios: For fetching data from external threat intelligence APIs.
// - fs-extra: For logging threat intelligence reports.
// - path: For managing file system paths.
// - predictiveThreatAnalyzer: Integration for predictive threat assessments.
//
// Usage:
// const { collectThreatIntelligence } = require('./threatIntelligence');
// collectThreatIntelligence().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { analyzeThreats } = require("../AI/predictiveThreatAnalyzer");
const { logInfo, logError } = require("./activityAuditLogger");

// Paths
const THREAT_INTELLIGENCE_DIR = path.resolve(__dirname, "../../Logs/ThreatIntelligence/");
const EXTERNAL_FEEDS = [
    "https://threatfeed.example.com/api/v1/intelligence",
    "https://defensehub.example.com/api/threats",
];

/**
 * Collects and aggregates threat intelligence from internal monitoring and external feeds.
 * @returns {Promise<void>}
 */
async function collectThreatIntelligence() {
    logInfo("Starting threat intelligence collection...");

    try {
        const localThreatData = await collectLocalThreatData();
        const externalThreatData = await fetchExternalThreatFeeds();

        const aggregatedData = [...localThreatData, ...externalThreatData];

        logInfo("Running predictive threat analysis on aggregated data...");
        const analysisResults = await analyzeThreats(aggregatedData);

        await logThreatIntelligence(analysisResults);
        logInfo("Threat intelligence collection and analysis completed.");
    } catch (error) {
        logError("Error during threat intelligence collection.", { error: error.message });
        throw error;
    }
}

/**
 * Collects threat data from internal monitoring systems.
 * @returns {Promise<Array<Object>>} - Local threat data.
 */
async function collectLocalThreatData() {
    logInfo("Collecting local threat data...");
    const localData = [
        {
            timestamp: new Date().toISOString(),
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            networkTraffic: Math.random() * 1000,
            suspiciousPatterns: Math.random() > 0.7, // Simulated pattern detection
        },
    ];
    logInfo("Local threat data collected successfully.");
    return localData;
}

/**
 * Fetches threat intelligence data from external APIs.
 * @returns {Promise<Array<Object>>} - External threat intelligence data.
 */
async function fetchExternalThreatFeeds() {
    logInfo("Fetching external threat intelligence feeds...");

    const externalData = [];

    for (const feedUrl of EXTERNAL_FEEDS) {
        try {
            logInfo(`Fetching data from ${feedUrl}`);
            const response = await axios.get(feedUrl);
            externalData.push(...response.data.threats);
        } catch (error) {
            logError(`Failed to fetch data from ${feedUrl}.`, { error: error.message });
        }
    }

    logInfo("External threat intelligence feeds fetched successfully.");
    return externalData;
}

/**
 * Logs threat intelligence data to a JSON file.
 * @param {Array<Object>} data - Aggregated threat intelligence data.
 * @returns {Promise<void>}
 */
async function logThreatIntelligence(data) {
    const logFilePath = path.join(THREAT_INTELLIGENCE_DIR, `threatIntelligence_${Date.now()}.json`);
    try {
        await fs.ensureDir(THREAT_INTELLIGENCE_DIR);
        await fs.writeJson(logFilePath, data, { spaces: 2 });
        logInfo(`Threat intelligence data logged successfully to ${logFilePath}`);
    } catch (error) {
        logError("Error logging threat intelligence data.", { error: error.message });
        throw error;
    }
}

module.exports = {
    collectThreatIntelligence,
};

// ------------------------------------------------------------------------------
// End of Module: Threat Intelligence
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation of threat intelligence aggregation.
// ------------------------------------------------------------------------------
