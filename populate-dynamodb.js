const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS
AWS.config.update({ region: 'us-east-1' }); // Change to your region
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function populateTable() {
    const config = JSON.parse(fs.readFileSync('./server/config.json', 'utf8'));
    const tableName = process.argv[2]; // Pass table name as argument
    
    if (!tableName) {
        console.error('Please provide table name as argument');
        process.exit(1);
    }

    for (const [hostname, selectors] of Object.entries(config)) {
        const params = {
            TableName: tableName,
            Item: {
                hostname,
                ...selectors
            }
        };

        try {
            await dynamodb.put(params).promise();
            console.log(`Added config for ${hostname}`);
        } catch (error) {
            console.error(`Error adding ${hostname}:`, error);
        }
    }
    
    console.log('DynamoDB population complete');
}

populateTable();