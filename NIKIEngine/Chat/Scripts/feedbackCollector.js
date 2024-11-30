"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Feedback Collector
//
// Description:
// Collects, stores, and analyzes user feedback to improve NIKI's performance 
// and user experience. Ensures feedback is categorized, stored securely, and 
// periodically reviewed.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// File to store feedback data
const feedbackStorePath = path.resolve(__dirname, "../Logs/feedback.json");

/**
 * Submits user feedback and categorizes it.
 * @param {string} userId - The ID of the user providing feedback.
 * @param {string} feedbackText - The feedback text.
 * @param {string} category - Category of feedback (e.g., "Bug Report", "Feature Request", "General Feedback").
 * @returns {Promise<void>}
 */
async function submitFeedback(userId, feedbackText, category = "General Feedback") {
    try {
        const feedbackData = (await fs.pathExists(feedbackStorePath)) ? await fs.readJson(feedbackStorePath) : [];

        const feedbackEntry = {
            id: generateUniqueId(),
            userId,
            feedbackText,
            category,
            timestamp: new Date().toISOString(),
            status: "New" // Default status for new feedback
        };

        feedbackData.push(feedbackEntry);
        await fs.writeJson(feedbackStorePath, feedbackData, { spaces: 2 });

        console.log(`[FeedbackCollector] Feedback submitted successfully by user ${userId}`);
    } catch (error) {
        console.error(`[FeedbackCollector] Error submitting feedback: ${error.message}`);
        throw new Error("Failed to submit feedback.");
    }
}

/**
 * Fetches all feedback entries.
 * @returns {Promise<Array<Object>>} - List of feedback entries.
 */
async function getAllFeedback() {
    try {
        if (!(await fs.pathExists(feedbackStorePath))) {
            return [];
        }

        return await fs.readJson(feedbackStorePath);
    } catch (error) {
        console.error(`[FeedbackCollector] Error fetching feedback: ${error.message}`);
        throw new Error("Failed to fetch feedback.");
    }
}

/**
 * Updates the status of a feedback entry.
 * @param {string} feedbackId - The ID of the feedback entry to update.
 * @param {string} newStatus - The new status for the feedback (e.g., "Reviewed", "Resolved").
 * @returns {Promise<void>}
 */
async function updateFeedbackStatus(feedbackId, newStatus) {
    try {
        const feedbackData = (await fs.pathExists(feedbackStorePath)) ? await fs.readJson(feedbackStorePath) : [];

        const feedbackIndex = feedbackData.findIndex((entry) => entry.id === feedbackId);
        if (feedbackIndex === -1) {
            throw new Error(`Feedback with ID ${feedbackId} not found.`);
        }

        feedbackData[feedbackIndex].status = newStatus;
        await fs.writeJson(feedbackStorePath, feedbackData, { spaces: 2 });

        console.log(`[FeedbackCollector] Feedback ID ${feedbackId} updated to status: ${newStatus}`);
    } catch (error) {
        console.error(`[FeedbackCollector] Error updating feedback status: ${error.message}`);
        throw new Error("Failed to update feedback status.");
    }
}

/**
 * Generates a unique ID for feedback entries.
 * @returns {string} - A unique ID string.
 */
function generateUniqueId() {
    return `feedback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

module.exports = {
    submitFeedback,
    getAllFeedback,
    updateFeedbackStatus
};

// ------------------------------------------------------------------------------
// End of Module: Feedback Collector
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for user feedback collection.
// ------------------------------------------------------------------------------