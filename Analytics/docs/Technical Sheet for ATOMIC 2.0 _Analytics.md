Technical Sheet for \ATOMIC 2.0\Analytics

Overview
The Analytics folder in the ATOMIC system is responsible for collecting, processing, and generating actionable insights from the ATOMIC blockchain network. It enables real-time monitoring, historical analysis, and user-interfacing through AI-driven natural language summaries and detailed reports.

This directory operates as a modular analytics engine, seamlessly integrated with other ATOMIC components like the API, HQ nodes, Worker nodes, and Shard Manager.

Directory Structure
graphql
Copy code
C:\ATOMIC 2.0\Analytics
│
├── analyticsEngine.js          # Main engine for processing and summarizing analytics.
├── metricsCollector.js         # Collects metrics from the network and individual nodes.
├── queryParser.js              # Maps user queries to actionable analytics operations.
├── alertManager.js             # Generates and manages text-based alerts for anomalies.
├── reportsGenerator.js         # Creates detailed JSON reports for metrics and health.
├── templates
│   └── summaryTemplate.json    # Text templates for generating structured summaries.
└── reports
    └── (Auto-generated reports saved as JSON files.)
Modules
Each file in the directory has a specific responsibility, detailed below:

1. analyticsEngine.js
Purpose: Core engine for processing and summarizing analytics.
Key Features:
Collects metrics using metricsCollector.js.
Generates natural language summaries using summaryTemplate.json.
Monitors analytics data for anomalies and triggers alerts through alertManager.js.
Saves raw and processed analytics to JSON files for historical reference.
Exports:
initializeAnalyticsEngine(): Sets up necessary directories and initializes the engine.
collectAnalytics(): Aggregates real-time metrics from the network and nodes.
generateSummary(data): Produces text summaries for user queries.
monitorAnalytics(data): Checks metrics for anomalies and triggers alerts.
saveAnalyticsData(data): Stores raw metrics data as JSON.
2. metricsCollector.js
Purpose: Collects real-time metrics from the ATOMIC blockchain network and nodes.
Key Features:
Fetches network-wide metrics (e.g., throughput, active nodes, total transactions).
Retrieves performance data from individual nodes (e.g., CPU usage, memory, latency).
Provides validation to ensure data integrity.
Exports:
getNetworkMetrics(): Fetches metrics from the network endpoint.
getNodePerformance(): Collects metrics from individual nodes.
collectAllMetrics(): Aggregates and validates network and node-level data.
3. queryParser.js
Purpose: Parses natural language queries into actionable analytics commands.
Key Features:
Maps predefined patterns to specific analytics operations.
Processes queries dynamically and integrates with analyticsEngine.js.
Provides fallback responses for unsupported queries.
Exports:
parseQuery(query): Processes user queries and executes appropriate analytics actions.
4. alertManager.js
Purpose: Manages text-based alerts triggered by anomalies in the analytics data.
Key Features:
Loads customizable alert templates from alertTemplate.json.
Generates alert messages dynamically based on predefined templates.
Supports alert levels (Info, Warning, Critical).
Sends alerts to the console (extendable to external systems like Slack or email).
Exports:
createAndSendAlert(details, level): Generates and sends alerts for specific issues.
5. reportsGenerator.js
Purpose: Generates detailed JSON reports for metrics and system health.
Key Features:
Creates reports for network metrics, node performance, and system health.
Supports custom report types and flexible data aggregation.
Saves reports to the reports/ directory with timestamped filenames.
Exports:
initializeReportsDirectory(): Prepares the directory for storing reports.
generateNetworkSummaryReport(): Creates a report for network-wide metrics.
generateNodePerformanceReport(): Summarizes individual node performance.
generateSystemHealthReport(): Combines network and node metrics into a system health overview.
generateCustomReport(name, dataFetchers): Creates user-defined reports using custom data fetchers.
6. templates/summaryTemplate.json
Purpose: Stores templates for generating natural language summaries.
Key Features:
Provides placeholders for dynamic data insertion (e.g., {throughput}, {activeNodes}).
Supports templates for network summaries, node performance, and system health.
Includes examples to simplify testing and debugging.
Data Flow
Collection:
metricsCollector.js gathers metrics from network and node endpoints.
Processing:
analyticsEngine.js processes collected metrics to generate insights and detect anomalies.
Alerts:
Detected anomalies trigger alertManager.js, which generates and sends alerts.
Reports:
reportsGenerator.js generates JSON reports based on collected metrics.
User Interaction:
queryParser.js parses user queries and provides responses using analyticsEngine.js.
Interdependencies
metricsCollector.js:
Required by analyticsEngine.js for real-time data collection.
analyticsEngine.js:
Used by queryParser.js to provide summarized analytics responses.
alertManager.js:
Triggered by analyticsEngine.js to handle anomalies.
reportsGenerator.js:
Can be invoked by any module to generate or save structured reports.
Expected Outputs
Reports Directory:

JSON files for:
network_summary_<timestamp>.json
node_performance_<timestamp>.json
system_health_<timestamp>.json
Console Alerts:

Example: [Critical] Alert: High CPU usage (95%) detected on Node Node-7.
Text-Based Summaries:

Example for Network:
yaml
Copy code
Network Summary (as of 2023-11-28T12:00:00Z):
- Throughput: 1,200 transactions/sec
- Active Nodes: 18/20
- Total Transactions Processed: 50,000,000
Future Enhancements
Custom Time Range Reports:
Allow users to specify time ranges for historical analytics.
Integration with External Systems:
Add support for exporting data to monitoring tools like Prometheus or dashboards.
Alert Distribution:
Expand alert capabilities to include email, SMS, or webhook integrations.






