const { exec } = require("child_process");

/**
 * Fetches the system's serial number using platform-specific commands.
 * @returns {Promise<string>} - The system's serial number.
 */
async function getSystemSerialNumber() {
    return new Promise((resolve, reject) => {
        const platform = process.platform;

        let command;
        if (platform === "win32") {
            // Command for Windows
            command = "wmic baseboard get serialnumber";
        } else if (platform === "darwin") {
            // Command for macOS
            command = "ioreg -l | grep IOPlatformSerialNumber";
        } else if (platform === "linux") {
            // Command for Linux
            command = "sudo dmidecode -s baseboard-serial-number";
        } else {
            reject(new Error(`Unsupported platform: ${platform}`));
            return;
        }

        exec(command, (error, stdout) => {
            if (error) {
                reject(new Error(`Failed to fetch serial number: ${error.message}`));
                return;
            }

            const serialNumber = stdout.trim().split("\n").pop().trim();
            if (!serialNumber) {
                reject(new Error("Serial number not found or command output empty."));
                return;
            }

            resolve(serialNumber);
        });
    });
}

module.exports = { getSystemSerialNumber };
