// transactionValidator.js
// Validates transactions within BranchNode1 to ensure integrity and compliance.

const crypto = require("crypto");
const fs = require("fs");

// Configuration
const TRANSACTIONS_DIRECTORY = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Transactions";
const VALIDATION_LOG = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Logs/transactionValidation.log";
const VALIDATION_REPORT = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/Reports/transactionValidationReport.json";
const PUBLIC_KEYS_DIRECTORY = "C:/ATOMIC 2.0/CorporateNodes/BranchNode1/PublicKeys"; // Directory for public keys

/**
 * Log messages to the validation log.
 * @param {string} message - The log message.
 */
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(VALIDATION_LOG, `[${timestamp}] ${message}\n`);
}

/**
 * Validate transaction structure.
 * @param {Object} transaction - The transaction data.
 * @returns {boolean} - True if the transaction has all required fields.
 */
function validateTransactionStructure(transaction) {
    const requiredFields = ["id", "timestamp", "from", "to", "amount", "signature"];
    return requiredFields.every(field => transaction.hasOwnProperty(field));
}

/**
 * Verify digital signature of a transaction.
 * @param {Object} transaction - The transaction data.
 * @returns {boolean} - True if the signature is valid.
 */
function verifySignature(transaction) {
    try {
        const { from, signature, ...transactionData } = transaction;

        // Retrieve the public key for the sender
        const publicKeyPath = `${PUBLIC_KEYS_DIRECTORY}/${from}.pub`;
        if (!fs.existsSync(publicKeyPath)) {
            logMessage(`ERROR: Missing public key for sender: ${from}`);
            return false;
        }

        const publicKey = fs.readFileSync(publicKeyPath, "utf8");

        // Verify the signature
        const verifier = crypto.createVerify("sha256");
        verifier.update(JSON.stringify(transactionData));
        verifier.end();

        return verifier.verify(publicKey, signature, "hex");
    } catch (error) {
        logMessage(`ERROR: Exception during signature verification - ${error.message}`);
        return false;
    }
}

/**
 * Validate transactions.
 */
function validateTransactions() {
    logMessage("Starting transaction validation...");

    if (!fs.existsSync(TRANSACTIONS_DIRECTORY)) {
        logMessage("ERROR: Transactions directory does not exist.");
        return;
    }

    const transactionFiles = fs.readdirSync(TRANSACTIONS_DIRECTORY).filter(file => file.endsWith(".json"));
    const validationResults = [];

    transactionFiles.forEach((fileName) => {
        try {
            const transactionPath = `${TRANSACTIONS_DIRECTORY}/${fileName}`;
            const transaction = JSON.parse(fs.readFileSync(transactionPath, "utf8"));

            // Validate structure
            if (!validateTransactionStructure(transaction)) {
                logMessage(`ERROR: Invalid structure in transaction: ${fileName}`);
                validationResults.push({
                    transaction: fileName,
                    status: "Failed",
                    reason: "Invalid structure",
                });
                return;
            }

            // Validate digital signature
            if (!verifySignature(transaction)) {
                logMessage(`ERROR: Signature verification failed for transaction: ${fileName}`);
                validationResults.push({
                    transaction: fileName,
                    status: "Failed",
                    reason: "Invalid signature",
                });
                return;
            }

            logMessage(`SUCCESS: Transaction validated successfully: ${fileName}`);
            validationResults.push({
                transaction: fileName,
                status: "Passed",
            });

        } catch (error) {
            logMessage(`ERROR: Exception during validation of transaction ${fileName} - ${error.message}`);
            validationResults.push({
                transaction: fileName,
                status: "Failed",
                reason: error.message,
            });
        }
    });

    fs.writeFileSync(VALIDATION_REPORT, JSON.stringify(validationResults, null, 4));
    logMessage("Transaction validation process completed. Report saved.");
}

// Execute validation
validateTransactions();