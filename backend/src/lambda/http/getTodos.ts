import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Get all TODO items for a user
    // const userId = '55fa3605-2082-484a-bd71-4d9ff9fcd8af'
    const userId = getUserId(event)
    logger.info(`Getting TODOs (userId=${userId})`)

    // Query todos
    const result = await client.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
    const todos = result.Items

    // Check if user exists
    logger.info('Found TODOs', {'data': todos})
    const userExists = true

    // Return response
    if (userExists) {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                todos
            })
        }
    } else {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'User does not exist'
            })
        }
    }
}