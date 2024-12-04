# Atomic Bit Bonding Node

## Overview
The **Bit Bonding Node** is responsible for **bonding bit atoms (0s and 1s) into byte atoms**. In the **Atomic Fission system**, 8 bit atoms are bonded to create 1 byte atom. This module ensures that all bits are accurately grouped and converted into bytes, forming the building block for higher-order atoms such as **KB, MB, GB, and TB**.

---

## Features
- **Bonding Logic**: Converts 8 bit atoms into 1 byte atom.
- **Express API**: Exposes an API endpoint to perform bit-to-byte bonding.
- **Error Handling**: Detects and logs incomplete bytes.
- **Jest Test Suite**: Ensures the bonding logic works correctly.

---

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Example](#example)
  - [API](#api)
- [Testing](#testing)
- [License](#license)

---

## Installation

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd Atomic/Atom/Bonding/Bit
Install Dependencies:
bash
Copy code
npm install
Configuration
The bonding node uses a config.json file for configuration.

json
Copy code
{
    "port": 4001,
    "logging": {
        "enabled": true,
        "level": "info",
        "destination": "./logs/bitBonding.log"
    }
}
port: The port on which the server runs.
logging: Controls the logging behavior, including level and log destination.
Usage
Example
Below is an example of how you can use the bitBonding.js module directly.

javascript
Copy code
const { bondBitsToBytes } = require('./script/bitBonding');

// Example: Convert 8 bits to 1 byte
const bits = [0, 1, 0, 0, 0, 0, 0, 1]; // Represents 'A'
const bytes = bondBitsToBytes(bits);

console.log('Bytes:', bytes.map(b => b.toString('utf8'))); // Output: [ 'A' ]
API
Start the server with:

bash
Copy code
npm start
POST /bondBits

Description: Bonds 8 bit atoms into 1 byte atom.
Request:
json
Copy code
{
    "bits": [0, 1, 0, 0, 0, 0, 0, 1]
}
Response:
json
Copy code
{
    "bytes": ["A"]
}
Testing
To ensure that the bonding logic works correctly, use the provided Jest tests.

Run Tests:

bash
Copy code
npm test
Expected Output:

vbnet
Copy code
PASS  tests/bitBonding.test.js
 ✓ Should bond 8 bits into 1 byte (3 ms)
 ✓ Should warn for incomplete byte (2 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
License
This project is licensed under the ATOMIC License.

markdown
Copy code

---

### **Explanation**

This **README** covers:
- **Installation instructions** to set up the bit bonding node.
- **Configuration parameters** to control the server behavior.
- **Usage examples** to demonstrate the bonding logic.
- **API documentation** to expose the bonding logic via HTTP.
- **Testing instructions** to ensure everything works as expected. 

This README provides all necessary information to effectively use and maintain the **Bit Bonding Node**