Bounce Rate Script
Overview
This bounceRate.js script is responsible for calculating and assigning bounce rates to various atomic units within the Mining Ledger. It maintains consistency with the atomic data structure by assigning bounce rates to proton, electron, and neutron JSON files inside each address folder across BITS, BYTES, KB, MB, GB, and TB ledgers.

Folder Structure
The mining ledger structure follows this format:

csharp
Copy code
Mining/
  [Unit]/
    [Address]/
      protonBounceRate.json
      electronBounceRate.json
      neutronBounceRate.json
Where:

[Unit]: BITS, BYTES, KB, MB, GB, TB
[Address]: A unique address folder containing JSON files for each particle's bounce rates.
Script Workflow
Key Functions
syncMiningFolders()

Ensures the structure of the mining ledger matches that of the frequency ledgers.
Creates address folders and JSON files if they are missing.
populateMiningLedger()

Iterates through all address folders in the frequency ledgers.
Calculates bounce rates using atom frequencies.
Saves the bounce rates to the corresponding JSON files in the mining ledger.
calculateBounceRate()

Averages a set of numeric bounce rates.
Returns the average bounce rate value (in milliseconds).
saveBounceRate()

Writes the bounce rate data into the mining ledger JSON files with metadata, including timestamp and ledger name.
Configuration
Ledgers: Paths to the frequency and mining ledgers are hardcoded within the script.
Bounce Rate Calculation: The calculateBounceRate() function expects an array of numeric frequencies.
Prerequisites
Node.js: Ensure Node.js is installed.
fs-extra: Used for file operations. Install using:
bash
Copy code
npm install fs-extra
Usage
To run the script manually:

bash
Copy code
node bounceRate.js
This will:

Synchronize the mining ledger folders with the frequency ledgers.
Populate the mining ledger with bounce rates for each particle and address.
Example
For an address dd523a0d7c9b3ab1327da991c7e167985b57ccce4330e04340614c3fa19564dd in the BITS ledger, the following files will be created inside the corresponding mining folder:

bash
Copy code
Mining/BITS/dd523a0d7c9b3ab1327da991c7e167985b57ccce4330e04340614c3fa19564dd/
  protonBounceRate.json
  electronBounceRate.json
  neutronBounceRate.json
Each JSON file will contain an entry like:

json
Copy code
{
  "address": "dd523a0d7c9b3ab1327da991c7e167985b57ccce4330e04340614c3fa19564dd",
  "ledger": "BITS",
  "bounceRate": "42.30",
  "timestamp": "2024-10-19T12:45:00.000Z"
}
Testing
A Jest-based test script is provided to ensure the correctness of folder synchronization, bounce rate calculations, and JSON updates. To run the tests:
bash
Copy code
npm test
Troubleshooting
File not found errors: Ensure the frequency ledgers contain valid address folders.
Invalid bounce rate: The calculateBounceRate() function expects valid numeric values; ensure the frequency JSON files are correctly populated.
License
This project is licensed under the ATOMIC license.

Author
Shawn Blackmore

