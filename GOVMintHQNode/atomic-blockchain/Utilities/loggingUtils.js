"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// GOVMintingHQNode - Logging Utilities with Compliance Reporting
//
// Description:
// Provides secure, centralized logging utilities with compliance reporting,
// Proof-of-Access validation, and encryption.
//
// Enhancements:
// - Compliance metrics logging and reporting.
// - Centralized log shipping via TLS.
// - Real-time API-ready compliance data.
//
// ------------------------------------------------------------------------------

const winston = require("winston");
const { format } = require("winston");
const os = require("os");
const crypto = require("crypto");
const path = require("path");
const tls = require("tls");
const fs = require("fs-extra");
const schedule = require("node-schedule");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

// **Configuration**
const LOG_DIR = "../logs";
const COMPLIANCE_REPORT_DIR = "../reports";
const REMOTE_LOG_SERVER = process.env.LOG_SERVER || "logs.atomic.gov";
const REMOTE_LOG_PORT = process.env.LOG_PORT || 514; // Default syslog port
const DEFAULT_LOG_LEVEL = process.env.LOG_LEVEL || "info";
const ENCRYPTION_KEY = crypto.randomBytes(32); // Replace with securely stored key
const ENCRYPTION_IV_LENGTH = 16; // AES-GCM IV length

// **Logger Setup**
const logger = winston.createLogger({
    level: DEFAULT_LOG_LEVEL,
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: format.combine(format.colorize(), format.printf(({ timestamp, level, message, ...meta }) => {
                return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
            })),
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, "combined.log"),
            format: format.json(),
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, "error.log"),
            level: "error",
            format: format.json(),
        }),
        new RemoteLogTransport({ level: DEFAULT_LOG_LEVEL }),
    ],
});

// **Custom Transport for Remote Log Shipping**
class RemoteLogTransport extends require("winston-transport") {
    constructor(opts) {
        super(opts);
        this.client = tls.connect({
            host: REMOTE_LOG_SERVER,
            port: REMOTE_LOG_PORT,
            rejectUnauthorized: true, // Enforce server certificate validation
        });

        this.client.on("error", (err) => {
            logger.error("Failed to connect to remote log server.", { error: err.message });
        });
    }

    log(info, callback) {
        const logMessage = JSON.stringify(info);
        this.client.write(logMessage + "\n", "utf8", callback);
    }
}

/**
 * Encrypt a log message using AES-GCM.
 * @param {string} message - The log message to encrypt.
 * @returns {string} - Encrypted log message in base64 format.
 */
function encryptLog(message) {
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag().toString("base64");

    return JSON.stringify({
        iv: iv.toString("base64"),
        authTag,
        data: encrypted,
    });
}

/**
 * Log atomic-level events with compliance metadata and Proof-of-Access validation.
 * @param {string} category - Atomic category ("neutron", "proton", "electron").
 * @param {string} message - The log message.
 * @param {Object} details - Additional metadata for the log.
 * @param {string} complianceArea - Compliance area (e.g., "key-management", "transaction-validation").
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 */
async function logAtomic(category, message, details = {}, complianceArea, tokenId, encryptedToken) {
    try {
        console.log("Validating token for logging...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);

        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        const logMessage = `[${category.toUpperCase()}]: ${message}`;
        const encryptedMessage = encryptLog(logMessage);

        const logEntry = {
            message: encryptedMessage,
            complianceArea,
            ...details,
        };

        switch (category) {
            case "neutron":
                logger.log("critical", logEntry);
                break;
            case "proton":
                logger.log("error", logEntry);
                break;
            case "electron":
                logger.log("info", logEntry);
                break;
            default:
                logger.log("warn", `Uncategorized: ${encryptedMessage}`, details);
        }
    } catch (error) {
        logger.error("Failed to log atomic event due to invalid token.", { error: error.message });
        throw error;
    }
}

/**
 * Generate compliance reports from aggregated logs.
 * @returns {Promise<void>}
 */
async function generateComplianceReport() {
    try {
        const logs = await fs.readJson(path.join(LOG_DIR, "combined.log"));
        const complianceMetrics = logs.reduce((metrics, log) => {
            const { complianceArea } = log;
            if (!complianceArea) return metrics;

            metrics[complianceArea] = (metrics[complianceArea] || 0) + 1;
            return metrics;
        }, {});

        const reportPath = path.join(COMPLIANCE_REPORT_DIR, `compliance-report-${Date.now()}.json`);
        await fs.writeJson(reportPath, { timestamp: new Date().toISOString(), complianceMetrics }, { spaces: 2 });

        logger.info("Compliance report generated successfully.", { reportPath });
    } catch (error) {
        logger.error("Failed to generate compliance report.", { error: error.message });
    }
}

/**
 * Schedule periodic compliance report generation.
 */
function scheduleComplianceReports() {
    schedule.scheduleJob("0 0 * * *", generateComplianceReport); // Generate daily at midnight
    logger.info("Scheduled daily compliance report generation.");
}

module.exports = {
    logAtomic,
    generateComplianceReport,
    scheduleComplianceReports,
};
