const axios = require('axios');

function isValidXrayKey(key, prefix) {
    // Dynamic regex to match the provided project key prefix followed by a hyphen and one or more digits
    const regex = new RegExp(`^${prefix}-\\d+$`);
    return regex.test(key);
}

module.exports = (on, config) => {
    // Read Xray configuration from Cypress environment variables
    const xrayConfig = config.env.xray;

    // Define the API endpoint path
    const endpoint = "/rest/raven/2.0/api/import/execution";

    on('before:run', async () => {
        if (!xrayConfig || !xrayConfig.testPlan) {
            console.error('Missing or invalid xray configuration. Skipping Xray integration.');
            return;
        }

        const testPlanId = xrayConfig.testPlan.trim();
        console.log('TEST PLAN: ' + testPlanId);

        // Extract project prefix from the test plan ID
        const projectKey = testPlanId.split('-')[0];
        console.log('PROJECT KEY: ' + projectKey);

        if (!isValidXrayKey(testPlanId, projectKey)) {
            console.error('Invalid test plan ID provided. Skipping Xray integration.');
            return;
        }

        config.projectKey = projectKey;  // Storing the project key in the config

        const testExecutionId = xrayConfig.testExecution ? xrayConfig.testExecution.trim() : '';
        console.log('TEST EXECUTION: ' + testExecutionId);

        if (!testExecutionId) {
            try {
                const executionSummary = `Execution of automated tests for ${new Date().toISOString()}`;
                const executionDescription = "This execution is automatically created when importing execution results from an external source";
                const payload = {
                    info: {
                        summary: executionSummary,
                        description: executionDescription,
                        project: projectKey,
                        testPlanKey: testPlanId
                    }
                };

                const response = await axios.post(xrayConfig.serverUrl.trim() + endpoint, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${xrayConfig.token}`
                    }
                });

                if (response.data && response.data.testExecIssue && response.data.testExecIssue.key) {
                    config.testExecutionKey = response.data.testExecIssue.key;  // Storing the test execution key in the config
                    console.log(`New test execution created with key: ${config.testExecutionKey}`);
                } else {
                    console.error('Failed to create test execution.');
                }
            } catch (error) {
                console.error(`Failed to create test execution. Error: ${error.message}`);
            }
        } else {
            config.testExecutionKey = testExecutionId;
            console.log('TEST EXECUTION FOUND FROM CONFIGURATION, IT WILL BE UPDATED...');
        }
    });

    on('after:spec', async (spec, results) => {
        if (!xrayConfig || !isValidXrayKey(config.testExecutionKey, config.projectKey)) {
            console.error('Missing or invalid xray configuration. Skipping Xray integration.');
            return;
        }

        const tests = results.tests.map(test => {
            const caseIdPattern = new RegExp(`${config.projectKey}-\\d+`);
            const match = test.title[1].match(caseIdPattern);
            const xrayId = match ? match[0] : "";
            return {
                testKey: xrayId,
                start: new Date().toISOString(),
                finish: new Date().toISOString(),
                comment: test.displayError || "Executed by Automation Framework",
                status: test.state === 'failed' ? 'FAIL' : 'PASS'
            };
        });

        const payload = {
            testExecutionKey: config.testExecutionKey,
            tests: tests
        };

        try {
            const response = await axios.post(xrayConfig.serverUrl.trim() + endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${xrayConfig.token}`
                }
            });

            console.log(`Test execution updated successfully in Xray.`);
        } catch (error) {
            console.error(`Failed to update test execution in Xray. Error: ${error.message}`);
        }
    });
};
