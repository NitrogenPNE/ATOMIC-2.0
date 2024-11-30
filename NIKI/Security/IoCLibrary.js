"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Indicators of Compromise (IoC) Library
//
// Description:
// Provides a framework for identifying Indicators of Compromise (IoCs) in shard
// data. Supports pattern matching, signature-based detection, and heuristic analysis.
//
// Author: Shawn Blackmore
//
// Features:
// - Signature-based IoC detection.
// - Regex pattern matching for known threat indicators.
// - Heuristic analysis for anomaly detection.
//
// Dependencies:
// - lodash: Utility library for data operations.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const _ = require("lodash");

// **IoC Database (Example Entries)**
const IoCDatabase = {
    signatures: [
        // Example signatures for malicious data patterns
        { id: "MAL-001", pattern: "malicious_code", description: "Malicious code detected." },
        { id: "MAL-002", pattern: "unauthorized_access", description: "Unauthorized access pattern detected." },
    ],
    regexPatterns: [
        // Example regex patterns for suspicious activity
        { id: "REGEX-001", regex: /eval\(.+\)/, description: "Suspicious eval function usage detected." },
        { id: "REGEX-002", regex: /base64_decode\(.+\)/, description: "Base64 decode activity detected." },
    ],
    heuristics: [
        // Example heuristic conditions
        { id: "HEUR-001", threshold: 0.8, description: "High anomaly score detected." },
    ],
};

/**
 * Detect IoCs in shard data using signature and regex matching.
 * @param {string} data - Shard data to analyze.
 * @returns {Array<Object>} - List of detected IoCs.
 */
function detect(data) {
    console.log("Scanning shard data for Indicators of Compromise...");

    const results = [];

    // Signature-based detection
    for (const signature of IoCDatabase.signatures) {
        if (data.includes(signature.pattern)) {
            console.warn(`IoC detected: ${signature.description}`);
            results.push({ id: signature.id, type: "signature", description: signature.description });
        }
    }

    // Regex-based detection
    for (const pattern of IoCDatabase.regexPatterns) {
        if (pattern.regex.test(data)) {
            console.warn(`IoC detected: ${pattern.description}`);
            results.push({ id: pattern.id, type: "regex", description: pattern.description });
        }
    }

    return results;
}

/**
 * Apply heuristic analysis to shard metadata for anomaly detection.
 * @param {Object} metadata - Metadata associated with the shard.
 * @returns {Object|null} - Detected heuristic-based IoC, or null if none detected.
 */
function analyzeHeuristics(metadata) {
    console.log("Performing heuristic analysis on shard metadata...");

    const anomalyScore = metadata.anomalyScore || 0; // Example heuristic metric
    const heuristic = IoCDatabase.heuristics.find((h) => anomalyScore >= h.threshold);

    if (heuristic) {
        console.warn(`Heuristic IoC detected: ${heuristic.description}`);
        return { id: heuristic.id, type: "heuristic", description: heuristic.description };
    }

    console.log("No heuristic IoCs detected.");
    return null;
}

/**
 * Comprehensive IoC detection combining signature, regex, and heuristic analysis.
 * @param {string} data - Shard data to analyze.
 * @param {Object} metadata - Metadata associated with the shard.
 * @returns {Array<Object>} - List of detected IoCs.
 */
function detectAll(data, metadata) {
    console.log("Starting comprehensive IoC detection...");

    const signatureAndRegexResults = detect(data);
    const heuristicResult = analyzeHeuristics(metadata);

    if (heuristicResult) {
        signatureAndRegexResults.push(heuristicResult);
    }

    if (signatureAndRegexResults.length === 0) {
        console.log("No Indicators of Compromise detected.");
    } else {
        console.warn(`Detected ${signatureAndRegexResults.length} IoCs.`);
    }

    return signatureAndRegexResults;
}

module.exports = {
    detect,
    analyzeHeuristics,
    detectAll,
};
