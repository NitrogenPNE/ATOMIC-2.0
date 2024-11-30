// shardIntegrityChecker.js
// Ensures the integrity of data shards in BranchNode1.

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// Configuration
const SHARD_DIRECTORY = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Shards";
const LOG_FILE = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Logs/integrityCheck.log";
const VALIDATION_REPORT = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Reports/integrityReport.json";

/**
 * Log messages to the log file.
 * @param {string} message - The log message.
 */
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

/**
 * Generate checksum for a file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - The calculated checksum.
 */
function generateChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256");
    hash.update(fileBuffer);
    return hash.digest("hex");
}

/**
 * Validate the integrity of shards.
 */
function validateShards() {
    logMessage("Starting shard integrity validation...");

    if (!fs.existsSync(SHARD_DIRECTORY)) {
        logMessage("ERROR: Shard directory does not exist.");
        return;
    }

    const shardFiles = fs.readdirSync(SHARD_DIRECTORY);
    const validationResults = [];

    shardFiles.forEach((fileName) => {
        const filePath = path.join(SHARD_DIRECTORY, fileName);
        const metadataPath = filePath + ".meta";

        if (!fs.existsSync(metadataPath)) {
            logMessage(`ERROR: Metadata file missing for shard: ${fileName}`);
            validationResults.push({
                shard: fileName,
                status: "Failed",
                reason: "Missing metadata file",
            });
            return;
        }

        try {
            const shardChecksum = generateChecksum(filePath);
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

            if (shardChecksum !== metadata.checksum) {
                logMessage(`ERROR: Integrity check failed for shard: ${fileName}`);
                validationResults.push({
                    shard: fileName,
                    status: "Failed",
                    reason: "Checksum mismatch",
                });
            } else {
                logMessage(`SUCCESS: Shard validated successfully: ${fileName}`);
                validationResults.push({
                    shard: fileName,
                    status: "Passed",
                });
            }
        } catch (error) {
            logMessage(`ERROR: Exception during validation of shard: ${fileName} - ${error.message}`);
            validationResults.push({
                shard: fileName,
                status: "Failed",
                reason: error.message,
            });
        }
    });

    fs.writeFileSync(VALIDATION_REPORT, JSON.stringify(validationResults, null, 4));
    logMessage("Shard integrity validation complete. Report saved.");
}

// Run validation
validateShards();