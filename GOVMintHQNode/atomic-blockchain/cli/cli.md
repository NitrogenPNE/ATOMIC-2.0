# cli.js

- Path: `C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\cli\cli.js`
- Size: 6411 bytes
- Last Modified: Thu Nov 28 15:19:38 2024

```
"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Enhanced Command-Line Interface (CLI)
 *
 * Description:
 * A secure CLI for ATOMIC blockchain with batch processing, interactive mode,
 * and advanced configuration management.
 * ---------------------------------------------------------------------------
 */

const { program } = require("commander");
const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { encryptPayload } = require("../utils/quantumCrypto"); // Quantum-resistant encryption utility

// **Default Configuration**
const CONFIG_PATH = path.join(os.homedir(), ".atomic-cli-config.json");
const DEFAULT_CONFIG = {
    apiEndpoint: "http://localhost:8080",
    apiToken: null,
    environment: "development", // Default environment
};

// **Load Configuration**
let config = { ...DEFAULT_CONFIG };
if (fs.existsSync(CONFIG_PATH)) {
    config = { ...config, ...fs.readJsonSync(CONFIG_PATH) };
}

/**
 * Save configuration to file.
 */
function saveConfig() {
    fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
}

/**
 * Helper: Send HTTP GET request with encryption.
 */
async function apiGet(endpoint) {
    try {
        const response = await axios.get(\`${config.apiEndpoint}${endpoint}\`, {
            headers: { Authorization: \`Bearer ${config.apiToken}\` },
        });
        return response.data;
    } catch (error) {
        console.error(chalk.red("Error fetching data:"), error.response?.data || error.message);
        process.exit(1);
    }
}

/**
 * Helper: Send HTTP POST request with encryption.
 */
async function apiPost(endpoint, payload) {
    try {
        const encryptedPayload = encryptPayload(payload, config.apiToken); // Secure the payload
        const response = await axios.post(\`${config.apiEndpoint}${endpoint}\`, encryptedPayload, {
            headers: { Authorization: \`Bearer ${config.apiToken}\` },
        });
        return response.data;
    } catch (error) {
        console.error(chalk.red("Error submitting data:"), error.response?.data || error.message);
        process.exit(1);
    }
}

/**
 * Helper: Print JSON data in a formatted manner.
 */
function printJson(data) {
    console.log(chalk.greenBright(JSON.stringify(data, null, 2)));
}

// **CLI Commands**
program
    .name("atomic-cli")
    .description("Secure Command-Line Interface for the ATOMIC Blockchain")
    .version("2.3.0");

// **Configuration Management**
program
    .command("config")
    .description("Manage CLI configuration settings.")
    .option("--set-endpoint <url>", "Set the API endpoint URL")
    .option("--set-token <token>", "Set the API authentication token")
    .option("--reset", "Reset configuration to defaults")
    .action((options) => {
        if (options.setEndpoint) {
            config.apiEndpoint = options.setEndpoint;
            console.log(chalk.blue("API endpoint updated to:"), options.setEndpoint);
        }
        if (options.setToken) {
            config.apiToken = options.setToken;
            console.log(chalk.blue("API token updated."));
        }
        if (options.reset) {
            config = { ...DEFAULT_CONFIG };
            console.log(chalk.blue("Configuration reset to defaults."));
        }
        saveConfig();
    });

// **Batch Node Management**
program
    .command("node batch <file>")
    .description("Batch manage nodes (add/remove) from a JSON file.")
    .action(async (file) => {
        try {
            const nodes = await fs.readJson(path.resolve(file));
            for (const { action, address } of nodes) {
                if (!/^ws:\/\/.+:\d+$/.test(address)) {
                    console.error(chalk.red(\`Invalid node address format: ${address}\`));
                    continue;
                }
                if (action === "add") {
                    console.log(chalk.blue(\`Adding node: ${address}\`));
                    await apiPost("/node/add", { node: address });
                } else if (action === "remove") {
                    console.log(chalk.blue(\`Removing node: ${address}\`));
                    await apiPost("/node/remove", { node: address });
                } else {
                    console.error(chalk.red("Invalid action for node:", action));
                }
            }
            console.log(chalk.greenBright("Batch node management completed."));
        } catch (error) {
            console.error(chalk.red("Error processing batch file:"), error.message);
            process.exit(1);
        }
    });

// **Interactive Mode**
program
    .command("interactive")
    .description("Launch interactive CLI mode.")
    .action(() => {
        console.log(chalk.greenBright("Welcome to ATOMIC CLI Interactive Mode!"));
        console.log(chalk.blue("Type a command (e.g., 'query block <hash>') or 'exit' to quit."));
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        const handleInput = async (input) => {
            if (input.trim() === "exit") {
                console.log(chalk.yellow("Exiting Interactive Mode."));
                rl.close();
                process.exit(0);
            }
            try {
                await program.parseAsync(input.split(" "), { from: "user" });
            } catch (error) {
                console.error(chalk.red("Invalid command:"), error.message);
            }
            rl.question("> ", handleInput);
        };

        rl.question("> ", handleInput);
    });

// **Query Block**
program
    .command("query block <hash>")
    .description("Query details of a specific block by its hash.")
    .action(async (hash) => {
        try {
            const data = await apiGet(\`/block/${hash}\`);
            printJson(data);
        } catch (error) {
            console.error(chalk.red("Error querying block:"), error.message);
        }
    });

// Parse and execute CLI commands
program.parse(process.argv);
```

