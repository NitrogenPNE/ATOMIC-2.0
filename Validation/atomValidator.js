const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configuration
const BASE_DIR = path.resolve(__dirname, "../"); // Adjust to your script location
const LOG_DIR = path.join(BASE_DIR, "Logs");
const ATOM_STORAGE = path.join(BASE_DIR, "Data", "Atoms");
const SCHEMA_PATH = path.join(BASE_DIR, "Config", "atomSchema.json");

// Logging utility
function logMessage(message, level = "INFO") {
    const logFile = path.join(LOG_DIR, "validation.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(logFile, logEntry, "utf8");
    console.log(logEntry);
}

// Ensure required directories and files exist
function ensureRequiredResources() {
    // Ensure Atom Storage directory exists
    if (!fs.existsSync(ATOM_STORAGE)) {
        fs.mkdirSync(ATOM_STORAGE, { recursive: true });
        logMessage(`[INFO] Created Atom Storage directory: ${ATOM_STORAGE}`);
    }

    // Ensure Schema Path exists and contains a default schema
    if (!fs.existsSync(SCHEMA_PATH)) {
        const defaultSchema = {
            id: { type: "string" },
            hash: { type: "string" },
            data: { type: "string" },
            dependencies: { type: "array" }
        };
        fs.writeFileSync(SCHEMA_PATH, JSON.stringify(defaultSchema, null, 4), "utf8");
        logMessage(`[INFO] Created default schema file at: ${SCHEMA_PATH}`);
    }
}

// Load Atom Schema
function loadSchema() {
    try {
        const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
        logMessage("Atom schema loaded successfully.");
        return schema;
    } catch (error) {
        logMessage(`Failed to load atom schema: ${error.message}`, "ERROR");
        throw error;
    }
}

// Other validation functions remain unchanged...
// (validateStructure, validateHash, validateDependencies, validateAtom)

// Main Validation Function
function validateAllAtoms() {
    logMessage("Starting atom validation...");

    // Ensure required resources exist
    ensureRequiredResources();

    // Load schema
    const schema = loadSchema();

    // Load all atom files
    const atomFiles = fs.readdirSync(ATOM_STORAGE).filter(file => file.endsWith(".json"));
    const availableAtoms = atomFiles.map(file => path.basename(file, ".json"));

    let validationResults = [];
    for (const file of atomFiles) {
        const filePath = path.join(ATOM_STORAGE, file);

        try {
            const atom = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const errors = validateAtom(atom, schema, availableAtoms);

            if (errors) {
                logMessage(`Validation failed for atom ${file}: ${errors.join("; ")}`, "ERROR");
                validationResults.push({ atom: file, status: "invalid", errors });
            } else {
                logMessage(`Atom ${file} validated successfully.`);
                validationResults.push({ atom: file, status: "valid" });
            }
        } catch (error) {
            logMessage(`Error reading or validating atom ${file}: ${error.message}`, "ERROR");
            validationResults.push({ atom: file, status: "error", errors: [error.message] });
        }
    }

    // Save validation results
    const resultsPath = path.join(LOG_DIR, "validation_results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(validationResults, null, 4), "utf8");
    logMessage(`Validation results saved to ${resultsPath}`);
    logMessage("Atom validation completed.");
}

// Run validation when executed
if (require.main === module) {
    try {
        validateAllAtoms();
    } catch (error) {
        logMessage(`Unexpected error during validation: ${error.message}`, "ERROR");
    }
}

module.exports = { validateAllAtoms, validateAtom, validateStructure, validateHash, validateDependencies };