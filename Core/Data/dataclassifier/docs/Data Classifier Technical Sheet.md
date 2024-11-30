ATOMIC Data Classifier Technical Sheet
1. Purpose
The Data Classifier Module is a core component of the ATOMIC blockchain that transforms incoming data into atomic structures such as bits, bytes, kilobytes (KB), megabytes (MB), gigabytes (GB), and terabytes (TB). This modular design ensures data compatibility with the sharded architecture and safeguards to reject malformed or unclassified inputs.

2. Key Features
Automated Classification: Converts incoming data into hierarchical atomic structures for efficient processing.
Scalable Units: Supports classification from bits to terabytes.
Data Validation: Rejects malformed or empty data.
Smart Contract Integration: Interacts with blockchain contracts to validate and record classification operations.
Multi-Format Support: Processes raw data, files, and JSON objects.
3. Module Breakdown
Location:
C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\core\dataClassifier\classifier.js

3.1 Core Functions
classifyData(inputData, userId)
Purpose: Performs the end-to-end classification of input data into atomic units.
Workflow:
Converts input data to a binary buffer.
Interacts with the DataClassifierContract to create a classification proposal.
Generates hierarchical atomic structures from bits to larger units.
Executes the classification proposal via the blockchain.
Output: Classified atomic data and transaction confirmation.
ensureBuffer(input)
Purpose: Converts input data into a Buffer for processing.
Workflow:
Converts strings to buffers.
Reads files and transforms them into buffers.
Serializes objects or arrays for buffer creation.
Output: Binary buffer of the input data.
createBitAtoms(totalBits)
Purpose: Generates individual bit atoms for the entire dataset.
Output: Array of bit atoms, each with a unique ID and value.
aggregateAtoms(atoms, limit)
Purpose: Aggregates smaller atomic units into larger structures.
Workflow:
Groups atoms based on the size limit (e.g., 8 bits for 1 byte).
Creates hierarchical structures like bytes, KB, MB, etc.
Output: Array of aggregated atomic structures.
getAtomTypeByLimit(limit)
Purpose: Maps size limits to corresponding atomic types.
Output: Atomic type (e.g., byte, KB, MB).
3.2 Supporting Components
A. Smart Contract

DataClassifierContract
Location:
C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\smartContracts\data\dataClassifier\dataClassifierContract.js
Purpose: Ensures secure, tamper-proof classification of data.
Key Functions:
createProposal(userId, type): Proposes a classification operation for the specified user.
executeProposal(proposal, data): Executes the proposal with the classified atomic data.
B. Atomic Constants

Definition:
Bit: 1
Byte: 8 bits
KB: 1024 bytes
MB: 1024 KB
GB: 1024 MB
TB: 1024 GB
Purpose: Defines the structure and relationships between atomic units.
4. Data Classification Workflow
4.1 Input Processing
Input:
Raw data (Buffer, string, or object).
Optional file path.
Process:
Converts input into binary format using ensureBuffer().
Output:
Binary buffer for further processing.
4.2 Atomic Unit Creation
Input:
Binary buffer.
Process:
Generates bit-level atoms using createBitAtoms().
Aggregates smaller atoms into bytes, KB, MB, GB, and TB using aggregateAtoms().
Output:
Hierarchical atomic structures.
4.3 Contract Execution
Input:
Atomic structures.
User ID.
Process:
Proposes and executes the classification via the DataClassifierContract.
Output:
Classification results recorded on the blockchain.
5. Atomic Structure Hierarchy
5.1 Levels
Bit Atoms: Fundamental units representing binary values (0 or 1).
Byte Atoms: Aggregates of 8 bits.
KB Atoms: Aggregates of 1024 bytes.
MB Atoms: Aggregates of 1024 KB.
GB Atoms: Aggregates of 1024 MB.
TB Atoms: Aggregates of 1024 GB.
5.2 Example
For a 1 MB file:

Bit Atoms: 8,388,608 (1 MB * 8 * 1024 * 1024).
Byte Atoms: 1,048,576.
KB Atoms: 1024.
MB Atoms: 1.
6. Error Handling
6.1 Input Validation
Malformed Data: Ensures all input data is valid binary or convertible.
Empty Data: Rejects zero-length inputs with a clear error message.
6.2 File Handling
Missing Files: Logs and throws errors for non-existent file paths.
Read Failures: Captures and reports read errors.
7. Testing and Validation
7.1 Unit Tests
Test ensureBuffer():
Validates successful conversion of strings, files, and objects.
Test createBitAtoms():
Ensures correct bit atom generation for various input sizes.
Test aggregateAtoms():
Verifies hierarchical aggregation for byte, KB, MB, etc.
7.2 Integration Tests
Simulates end-to-end classification for various data types and sizes.
8. Metrics and Alerts
8.1 Metrics
Atom Generation Rate: Tracks the speed of bit-to-atom conversion.
Classification Throughput: Measures data processed per second.
8.2 Alerts
Invalid Input: Triggers when unsupported input types are detected.
Classification Failures: Alerts on contract execution errors.
9. Future Enhancements
9.1 Adaptive Classification
Dynamically adjusts atomic unit thresholds based on data type and size.
9.2 Enhanced Error Reporting
Provides detailed logs for contract interaction issues.
9.3 AI-Based Data Structuring
Incorporates machine learning to predict optimal classification structures.
Summary
The Data Classifier Module is integral to the ATOMIC blockchain, ensuring efficient and secure transformation of raw data into atomic structures. Its hierarchical approach supports the system's scalable architecture, while its robust validation mechanisms ensure integrity and compliance.






