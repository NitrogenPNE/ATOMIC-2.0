"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Alerts Dispatcher
//
// Description:
// Dispatches alerts to stakeholders in response to incidents, anomalies, or
// system events. Supports multiple notification channels such as email, SMS,
// and Slack.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - nodemailer: For sending email notifications.
// - twilio: For sending SMS alerts.
// - axios: For sending Slack webhook messages.
// - fs-extra: For logging dispatched alerts.
//
// Usage:
// const { sendAlert } = require('./alertsDispatcher');
// sendAlert("SecurityTeam", "Critical alert: Data breach detected.")
//     .then(console.log)
//     .catch(console.error);
// ------------------------------------------------------------------------------

const nodemailer = require("nodemailer");
const twilio = require("twilio");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths
const ALERTS_LOG_DIR = path.resolve(__dirname, "../../Logs/Alerts/");
const CONFIG_PATH = path.resolve(__dirname, "../Config/alertsConfig.json");

/**
 * Sends an alert to the specified recipient(s).
 * @param {string} recipient - Target recipient group or individual (e.g., "SecurityTeam").
 * @param {string} message - The alert message to send.
 * @returns {Promise<void>}
 */
async function sendAlert(recipient, message) {
    logInfo(`Dispatching alert to ${recipient}: ${message}`);

    try {
        const config = await loadConfig();

        // Dispatch alert through configured channels
        if (config.alertTypes.includes("email")) {
            await sendEmail(config.recipients.email, message);
        }
        if (config.alertTypes.includes("sms")) {
            await sendSMS(config.recipients.sms, message);
        }
        if (config.alertTypes.includes("slack")) {
            await sendSlackNotification(config.recipients.slackWebhook, message);
        }

        await logAlert(recipient, message);
        logInfo(`Alert successfully dispatched to ${recipient}.`);
    } catch (error) {
        logError(`Failed to dispatch alert to ${recipient}: ${error.message}`);
        throw error;
    }
}

/**
 * Loads the alert configuration file.
 * @returns {Promise<Object>} - Parsed JSON configuration.
 */
async function loadConfig() {
    if (!(await fs.pathExists(CONFIG_PATH))) {
        throw new Error("Alert configuration file not found.");
    }
    return fs.readJson(CONFIG_PATH);
}

/**
 * Sends an email alert.
 * @param {Array<string>} recipients - List of email addresses.
 * @param {string} message - The alert message.
 * @returns {Promise<void>}
 */
async function sendEmail(recipients, message) {
    logInfo("Sending email alert...");

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipients.join(", "),
            subject: "National Defense HQ Node Alert",
            text: message,
        });

        logInfo("Email alert sent successfully.");
    } catch (error) {
        logError("Failed to send email alert.", { error: error.message });
        throw error;
    }
}

/**
 * Sends an SMS alert.
 * @param {Array<string>} phoneNumbers - List of phone numbers.
 * @param {string} message - The alert message.
 * @returns {Promise<void>}
 */
async function sendSMS(phoneNumbers, message) {
    logInfo("Sending SMS alert...");

    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        for (const phone of phoneNumbers) {
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });
        }

        logInfo("SMS alerts sent successfully.");
    } catch (error) {
        logError("Failed to send SMS alerts.", { error: error.message });
        throw error;
    }
}

/**
 * Sends a Slack notification.
 * @param {string} webhookUrl - Slack webhook URL.
 * @param {string} message - The alert message.
 * @returns {Promise<void>}
 */
async function sendSlackNotification(webhookUrl, message) {
    logInfo("Sending Slack notification...");

    try {
        await axios.post(webhookUrl, {
            text: message,
        });

        logInfo("Slack notification sent successfully.");
    } catch (error) {
        logError("Failed to send Slack notification.", { error: error.message });
        throw error;
    }
}

/**
 * Logs the dispatched alert to a file.
 * @param {string} recipient - Target recipient group or individual.
 * @param {string} message - The alert message.
 * @returns {Promise<void>}
 */
async function logAlert(recipient, message) {
    const logFilePath = path.join(ALERTS_LOG_DIR, `alertsLog_${Date.now()}.json`);

    try {
        await fs.ensureDir(ALERTS_LOG_DIR);

        const logEntry = {
            timestamp: new Date().toISOString(),
            recipient,
            message,
        };

        await fs.writeJson(logFilePath, logEntry, { spaces: 2 });
        logInfo(`Alert logged: ${logFilePath}`);
    } catch (error) {
        logError("Failed to log alert.", { error: error.message });
    }
}

module.exports = {
    sendAlert,
};

// ------------------------------------------------------------------------------
// End of Module: Alerts Dispatcher
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation of alert dispatching through email, SMS, and Slack.
// ------------------------------------------------------------------------------
