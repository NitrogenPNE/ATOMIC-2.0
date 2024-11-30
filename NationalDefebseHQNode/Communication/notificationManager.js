"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Notification Manager
//
// Description:
// Manages notifications for personnel and system alerts within the National Defense HQ Node. 
// Supports multiple channels, including email, SMS, and in-app notifications.
//
// Dependencies:
// - nodemailer: For email notifications.
// - twilio: For SMS notifications.
// - activityAuditLogger: Logs notification events.
//
// Usage:
// const { sendNotification } = require('./notificationManager');
// sendNotification("userId-001", "You have a new training module assigned.").then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const nodemailer = require("nodemailer");
const twilio = require("twilio");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Notification Settings
const NOTIFICATION_CHANNELS = ["email", "sms", "in-app"];

// Email Configuration
const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// SMS Configuration
const smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-App Notifications Placeholder (to be implemented in future versions)
const inAppNotifications = {
    send: async (userId, message) => {
        logInfo(`In-App Notification: Sent to ${userId}: ${message}`);
    },
};

/**
 * Sends a notification to the user through configured channels.
 * @param {string} userId - ID of the user receiving the notification.
 * @param {string} message - Notification message to send.
 * @param {Array<string>} channels - Optional list of channels to use (default: all).
 * @returns {Promise<void>}
 */
async function sendNotification(userId, message, channels = NOTIFICATION_CHANNELS) {
    logInfo(`Sending notification to user: ${userId}, Message: ${message}`);

    try {
        const selectedChannels = channels.filter((channel) => NOTIFICATION_CHANNELS.includes(channel));

        for (const channel of selectedChannels) {
            switch (channel) {
                case "email":
                    await sendEmailNotification(userId, message);
                    break;
                case "sms":
                    await sendSmsNotification(userId, message);
                    break;
                case "in-app":
                    await inAppNotifications.send(userId, message);
                    break;
                default:
                    logError(`Unsupported notification channel: ${channel}`);
            }
        }

        logInfo(`Notification sent successfully to user: ${userId}`);
    } catch (error) {
        logError(`Failed to send notification to user: ${userId}`, { error: error.message });
        throw error;
    }
}

/**
 * Sends an email notification.
 * @param {string} userId - ID of the user.
 * @param {string} message - Notification message.
 */
async function sendEmailNotification(userId, message) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${userId}@example.com`, // Replace with actual user email mapping
            subject: "Notification from National Defense HQ Node",
            text: message,
        };

        await emailTransporter.sendMail(mailOptions);
        logInfo(`Email notification sent to ${userId}`);
    } catch (error) {
        logError(`Failed to send email to ${userId}`, { error: error.message });
        throw error;
    }
}

/**
 * Sends an SMS notification.
 * @param {string} userId - ID of the user.
 * @param {string} message - Notification message.
 */
async function sendSmsNotification(userId, message) {
    try {
        const phoneNumber = getUserPhoneNumber(userId); // Replace with actual phone number lookup logic

        if (!phoneNumber) {
            throw new Error(`No phone number found for user: ${userId}`);
        }

        await smsClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });

        logInfo(`SMS notification sent to ${userId}`);
    } catch (error) {
        logError(`Failed to send SMS to ${userId}`, { error: error.message });
        throw error;
    }
}

/**
 * Placeholder for retrieving user phone numbers.
 * @param {string} userId - ID of the user.
 * @returns {string|null} - Phone number or null if not found.
 */
function getUserPhoneNumber(userId) {
    const phoneDirectory = {
        "userId-001": "+1234567890",
        "userId-002": "+0987654321",
    };

    return phoneDirectory[userId] || null;
}

module.exports = {
    sendNotification,
};
