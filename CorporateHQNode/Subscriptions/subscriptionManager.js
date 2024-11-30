/**
 * @file subscriptionManager.js
 * @description Manages subscriptions for clients and corporate entities within the ATOMIC CorporateHQNode.
 * Handles subscription creation, validation, renewal, and cancellation processes.
 * 
 * @author ATOMIC Development Team
 */

// Dependencies
const fs = require("fs");
const path = require("path");

// Configuration
const subscriptionsDir = "C:\\ATOMIC 2.0\\CorporateHQNode\\Subscriptions\\SubscriptionsData";
const logFilePath = "C:\\ATOMIC 2.0\\CorporateHQNode\\Subscriptions\\subscriptionManager.log";

// Ensure directories exist
if (!fs.existsSync(subscriptionsDir)) {
    fs.mkdirSync(subscriptionsDir, { recursive: true });
    logEvent("Created directory for subscription data.");
}

/**
 * Logs events to the log file.
 * @param {string} message - The message to log.
 * @param {string} level - Log level (INFO, WARN, ERROR).
 */
function logEvent(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
    console.log(logMessage.trim());
}

/**
 * Creates a new subscription for a given entity.
 * @param {string} entityId - The ID of the entity.
 * @param {Object} subscriptionDetails - Details of the subscription (e.g., type, duration).
 */
function createSubscription(entityId, subscriptionDetails) {
    try {
        logEvent(`Creating subscription for entity ID: ${entityId}`);
        const subscriptionId = `${entityId}-${Date.now()}`;
        const subscriptionData = {
            subscriptionId,
            entityId,
            ...subscriptionDetails,
            createdAt: new Date().toISOString(),
            status: "Active",
        };

        const filePath = path.join(subscriptionsDir, `${subscriptionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(subscriptionData, null, 4), "utf8");

        logEvent(`Subscription created successfully: ${subscriptionId}`);
        return subscriptionId;
    } catch (error) {
        logEvent(`Error creating subscription: ${error.message}`, "ERROR");
        throw error;
    }
}

/**
 * Validates if a subscription is active and valid.
 * @param {string} subscriptionId - The ID of the subscription to validate.
 * @returns {boolean} - True if the subscription is active, otherwise false.
 */
function validateSubscription(subscriptionId) {
    try {
        logEvent(`Validating subscription ID: ${subscriptionId}`);
        const filePath = path.join(subscriptionsDir, `${subscriptionId}.json`);
        if (!fs.existsSync(filePath)) {
            logEvent(`Subscription ID not found: ${subscriptionId}`, "WARN");
            return false;
        }

        const subscriptionData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (subscriptionData.status === "Active") {
            logEvent(`Subscription ID ${subscriptionId} is valid.`);
            return true;
        }

        logEvent(`Subscription ID ${subscriptionId} is not active.`);
        return false;
    } catch (error) {
        logEvent(`Error validating subscription: ${error.message}`, "ERROR");
        throw error;
    }
}

/**
 * Renews an existing subscription.
 * @param {string} subscriptionId - The ID of the subscription to renew.
 * @param {number} duration - Duration in days for the renewal.
 */
function renewSubscription(subscriptionId, duration) {
    try {
        logEvent(`Renewing subscription ID: ${subscriptionId}`);
        const filePath = path.join(subscriptionsDir, `${subscriptionId}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Subscription ID not found: ${subscriptionId}`);
        }

        const subscriptionData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (subscriptionData.status !== "Active") {
            throw new Error(`Subscription ID ${subscriptionId} is not active.`);
        }

        subscriptionData.renewedAt = new Date().toISOString();
        subscriptionData.duration = duration;
        subscriptionData.expiryDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

        fs.writeFileSync(filePath, JSON.stringify(subscriptionData, null, 4), "utf8");
        logEvent(`Subscription ID ${subscriptionId} renewed for ${duration} days.`);
    } catch (error) {
        logEvent(`Error renewing subscription: ${error.message}`, "ERROR");
        throw error;
    }
}

/**
 * Cancels an existing subscription.
 * @param {string} subscriptionId - The ID of the subscription to cancel.
 */
function cancelSubscription(subscriptionId) {
    try {
        logEvent(`Cancelling subscription ID: ${subscriptionId}`);
        const filePath = path.join(subscriptionsDir, `${subscriptionId}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Subscription ID not found: ${subscriptionId}`);
        }

        const subscriptionData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        subscriptionData.status = "Cancelled";
        subscriptionData.cancelledAt = new Date().toISOString();

        fs.writeFileSync(filePath, JSON.stringify(subscriptionData, null, 4), "utf8");
        logEvent(`Subscription ID ${subscriptionId} cancelled successfully.`);
    } catch (error) {
        logEvent(`Error cancelling subscription: ${error.message}`, "ERROR");
        throw error;
    }
}

// Example usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const action = args[0];
    const subscriptionId = args[1];
    const entityId = args[2];
    const duration = args[3];

    try {
        switch (action) {
            case "create":
                console.log(
                    `Created subscription: ${createSubscription(entityId, { duration: parseInt(duration, 10) })}`
                );
                break;
            case "validate":
                console.log(
                    `Subscription ${subscriptionId} is ${validateSubscription(subscriptionId) ? "valid" : "invalid"
                    }.`
                );
                break;
            case "renew":
                renewSubscription(subscriptionId, parseInt(duration, 10));
                console.log(`Renewed subscription: ${subscriptionId}`);
                break;
            case "cancel":
                cancelSubscription(subscriptionId);
                console.log(`Cancelled subscription: ${subscriptionId}`);
                break;
            default:
                console.log("Usage: node subscriptionManager.js <create|validate|renew|cancel> [params]");
        }
    } catch (error) {
        console.error("Error executing action:", error.message);
    }
}

module.exports = {
    createSubscription,
    validateSubscription,
    renewSubscription,
    cancelSubscription,
};
