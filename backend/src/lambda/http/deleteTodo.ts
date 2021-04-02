import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // Get the userId from authentication header
    const userId = getUserId(event)

    // Get the todoId from path paramters
    const todoId = event.pathParameters.todoId

    // Query todos
    logger.info(`Deleting TODO (todoId=${todoId})`)
    const result = await client.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',  // can you add a ConditionExpression to client.query???
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
    // Find the specified todo 
    const todos = result.Items
    const todo = todos.filter(todo => todo.todoId == todoId)[0]
    if (todo) {
        logger.info('Found matching TODO', {'data': todo})
        const createdAt = todo.createdAt
        await client.delete({
            TableName: todosTable,
            Key: {
                userId,
                createdAt,
            },
            ConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': todoId
            }
        }).promise()

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                todoId
            })
        }
    } else {
        logger.info('Unable to find matching TODO')
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                todoId
            })
        }
    }
}
