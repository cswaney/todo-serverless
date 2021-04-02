import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // Get the userId from the authorization header
    const userId = getUserId(event)
    
    // Query todo items
    logger.info(`Getting TODOs (userId=${userId})`)
    const result = await client.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
    const todos = result.Items

    // Return response
    logger.info('Found TODOs', { 'data': todos })
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            todos
        })
    }
}