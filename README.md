# Cypress Xray Integration Plugin

This Cypress plugin provides seamless integration with Xray for test management in Jira. It automates the creation and updating of test executions based on the results of Cypress test runs, allowing you to track automated test executions directly within Xray.

## Features

- Automatically create new test executions in Xray if none are specified.
- Update existing test executions with results from Cypress tests.

## Installation

Install the plugin via npm:

```bash
npm install cypress-xray-integration
```

## Configuration

To use this plugin, you need to configure it in your Cypress setup. Add the plugin to your <em>cypress.config.js</em> file and set the required environment variables.

### Load the Plugin
Add the following line to your <em>cypress.config.js</em>:

```javascript
const xrayPlugin = require('cypress-xray-integration');
```

### Configure the Plugin
Include the plugin in the setupNodeEvents function in your <em>cypress.config.js</em>:

```javascript
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      xrayPlugin(on, config);
    },
    env: {
      xray: {
        serverUrl: "YOUR_XRAT_SERVER"
        testPlan: "YOUR_TEST_PLAN_ID",
        testExecution: "YOUR_TEST_EXECUTION_ID", // Optional, leave blank to create new execution
        token: "YOUR_XRAY_API_TOKEN"
      }
    }
  }
});

```
Replace YOUR_XRAT_SERVER, YOUR_TEST_PLAN_ID, YOUR_TEST_EXECUTION_ID and YOUR_XRAY_API_TOKEN

## Test Configuration
To ensure that test results are correctly linked to the appropriate Xray test cases, you must include the Xray test case ID within the title of each <strong>it</strong> block in your test specifications. Here's an example:

```javascript
describe('Login Functionality', () => {
    it('XDEMO-123: should successfully log in with valid credentials', () => {
        // Test code here
    });

    it('XDEMO-124: should display an error for invalid credentials', () => {
        // Test code here
    });
});
```
Replace XDEMO-123 and XDEMO-124 with the actual Xray test case IDs that correspond to your test cases.

## Usage
Once configured, the plugin will automatically sync your test results with Xray based on the execution of your Cypress tests. No additional steps are required during test runs.

You can explicitly configure the plugin parameters during the Cypress run command by passing environment variables. For example:

```bash
cypress run --env xray.testPlan=XDEMO-595,xray.testExecution=,xray.token=YOUR_XRAY_API_TOKEN
```
This method is particularly useful for configuring different environments or specific test runs without changing the main configuration file.

## License
This project is licensed under the MIT License - see the <em>LICENSE.md</em> file for details.