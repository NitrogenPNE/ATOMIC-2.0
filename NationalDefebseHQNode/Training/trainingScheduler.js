"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Training Scheduler
//
// Description:
// Automates the scheduling and tracking of training sessions for personnel
// within the National Defense HQ Node. Integrates with personnel clearance 
// levels to assign appropriate training modules.
//
// Dependencies:
// - fs-extra: For file and training log operations.
// - path: For file path management.
// - activityAuditLogger: Logs training activity and schedules.
// - notificationManager: Sends notifications to personnel for scheduled training.
//
// Usage:
// const { scheduleTraining, trackCompletion } = require('./trainingScheduler');
// scheduleTraining("userId-001", "Cybersecurity Basics").then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const notificationManager = require("../Communication/notificationManager");

// Paths
const TRAINING_SCHEDULE_FILE = path.resolve(__dirname, "./trainingSchedule.json");
const TRAINING_LOGS_FILE = path.resolve(__dirname, "./trainingLogs.json");

// Default Training Modules
const TRAINING_MODULES = {
    "Tier 1": ["Cybersecurity Basics"],
    "Tier 2": ["Advanced Security Practices"],
    "Tier 3": ["Threat Detection and Response"],
    "Tier 4": ["Zero Trust Policies and Applications"],
    "Tier 5": ["Quantum-Resistant Cryptography"],
};

/**
 * Schedules a training session for a user.
 * @param {string} userId - ID of the user.
 * @param {string} module - Name of the training module.
 * @returns {Promise<void>}
 */
async function scheduleTraining(userId, module) {
    logInfo(`Scheduling training for user: ${userId}, module: ${module}`);

    try {
        const trainingSchedule = await loadTrainingSchedule();

        if (!trainingSchedule[userId]) {
            trainingSchedule[userId] = [];
        }

        trainingSchedule[userId].push({
            module,
            scheduledAt: new Date().toISOString(),
            status: "Scheduled",
        });

        await saveTrainingSchedule(trainingSchedule);

        // Notify user about the training session
        await notificationManager.sendNotification(
            userId,
            `You have been scheduled for the training module: ${module}`
        );

        logInfo(`Training scheduled successfully for user: ${userId}`);
    } catch (error) {
        logError(`Failed to schedule training for user: ${userId}`, { error: error.message });
        throw error;
    }
}

/**
 * Tracks the completion of a training module for a user.
 * @param {string} userId - ID of the user.
 * @param {string} module - Name of the training module.
 * @returns {Promise<void>}
 */
async function trackCompletion(userId, module) {
    logInfo(`Tracking training completion for user: ${userId}, module: ${module}`);

    try {
        const trainingSchedule = await loadTrainingSchedule();

        if (!trainingSchedule[userId]) {
            throw new Error(`No training records found for user: ${userId}`);
        }

        const moduleEntry = trainingSchedule[userId].find(
            (entry) => entry.module === module && entry.status === "Scheduled"
        );

        if (!moduleEntry) {
            throw new Error(`No scheduled training found for module: ${module} and user: ${userId}`);
        }

        moduleEntry.status = "Completed";
        moduleEntry.completedAt = new Date().toISOString();

        await saveTrainingSchedule(trainingSchedule);
        logInfo(`Training completion tracked successfully for user: ${userId}, module: ${module}`);
    } catch (error) {
        logError(`Failed to track training completion for user: ${userId}`, { error: error.message });
        throw error;
    }
}

/**
 * Loads the training schedule from the file system.
 * @returns {Promise<Object>} - Parsed training schedule.
 */
async function loadTrainingSchedule() {
    if (await fs.pathExists(TRAINING_SCHEDULE_FILE)) {
        return fs.readJson(TRAINING_SCHEDULE_FILE);
    }
    return {}; // Return an empty schedule if none exists
}

/**
 * Saves the training schedule to the file system.
 * @param {Object} trainingSchedule - Training schedule to save.
 */
async function saveTrainingSchedule(trainingSchedule) {
    await fs.writeJson(TRAINING_SCHEDULE_FILE, trainingSchedule, { spaces: 2 });
    logInfo("Training schedule saved successfully.");
}

module.exports = {
    scheduleTraining,
    trackCompletion,
};