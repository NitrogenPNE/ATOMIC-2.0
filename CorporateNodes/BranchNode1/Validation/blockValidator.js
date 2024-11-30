// blockValidator.js
// Validates blocks to ensure integrity, structure, and sequence compliance in BranchNode1.

const crypto = require("crypto");
const fs = require("fs");

// Configuration
const BLOCKS_DIRECTORY = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Blocks";
const VALIDATION_LOG = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Logs/blockValidation.log";
const VALIDATION_REPORT = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Reports/blockValidationReport.json";

/**
 * Log messages to the validation log.
 * @param {string} message - The log message.
 */
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(VALIDATION_LOG, `[${timestamp}] ${message}\n`);
}

/**
 * Verify block hash integrity.
 * @param {Object} block - The block data.
 * @returns {boolean} - True if the block's hash matches its contents.
 */
function verifyBlockHash(block) {
    const blockCopy = { ...block };
    delete blockCopy.hash;
    const blockString = JSON.stringify(blockCopy);
    const calculatedHash = crypto.createHash("sha256").update(blockString).digest("hex");
    return calculatedHash === block.hash;
}

/**
 * Validate block structure.
 * @param {Object} block - The block data.
 * @returns {boolean} - True if the block has all required fields.
 */
function validateBlockStructure(block) {
    const requiredFields = ["index", "timestamp", "data", "previousHash", "hash"];
    return requiredFields.every(field => block.hasOwnProperty(field));
}

/**
 * Validate block sequence.
 * @param {Object} currentBlock - The current block data.
 * @param {Object} previousBlock - The previous block data.
 * @returns {boolean} - True if the sequence is valid.
 */
function validateBlockSequence(currentBlock, previousBlock) {
    return (
        currentBlock.index === previousBlock.index + 1 &&
        currentBlock.previousHash === previousBlock.hash
    );
}

/**
 * Perform block validation.
 */
function validateBlocks() {
    logMessage("Starting block validation...");

    if (!fs.existsSync(BLOCKS_DIRECTORY)) {
        logMessage("ERROR: Blocks directory does not exist.");
        return;
    }

    const blockFiles = fs.readdirSync(BLOCKS_DIRECTORY).filter(file => file.endsWith(".json"));
    const validationResults = [];

    let previousBlock = null;

    blockFiles.sort().forEach((fileName) => {
        try {
            const blockPath = `${BLOCKS_DIRECTORY}/${fileName}`;
            const block = JSON.parse(fs.readFileSync(blockPath, "utf8"));

            // Validate structure
            if (!validateBlockStructure(block)) {
                logMessage(`ERROR: Block structure invalid for ${fileName}`);
                validationResults.push({
                    block: fileName,
                    status: "Failed",
                    reason: "Invalid structure",
                });
                return;
            }

            // Validate hash integrity
            if (!verifyBlockHash(block)) {
                logMessage(`ERROR: Hash mismatch for ${fileName}`);
                validationResults.push({
                    block: fileName,
                    status: "Failed",
                    reason: "Hash mismatch",
                });
                return;
            }

            // Validate sequence if there's a previous block
            if (previousBlock && !validateBlockSequence(block, previousBlock)) {
                logMessage(`ERROR: Sequence mismatch for ${fileName}`);
                validationResults.push({
                    block: fileName,
                    status: "Failed",
                    reason: "Sequence mismatch",
                });
                return;
            }

            logMessage(`SUCCESS: Block validated successfully: ${fileName}`);
            validationResults.push({
                block: fileName,
                status: "Passed",
            });

            // Update previousBlock for the next iteration
            previousBlock = block;

        } catch (error) {
            logMessage(`ERROR: Exception during validation of ${fileName} - ${error.message}`);
            validationResults.push({
                block: fileName,
                status: "Failed",
                reason: error.message,
            });
        }
    });

    fs.writeFileSync(VALIDATION_REPORT, JSON.stringify(validationResults, null, 4));
    logMessage("Block validation process completed. Report saved.");
}

// Execute validation
validateBlocks();