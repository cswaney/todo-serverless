import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // Parse the request body
    const updateRequest: UpdateTodoRequest = JSON.parse(event.body)

    // Get the userId from the authorization header
    const userId = getUserId(event)

    // Get the todoId from the path parameters
    const todoId = event.pathParameters.todoId
    
    // Query todos
    logger.info(`Updating TODO (todoId=${todoId})`)
    const result = await client.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
    const todos = result.Items
    const todo = todos.filter(todo => todo.todoId == todoId)[0]
    if (todo) {
        logger.info('Found matching TODO', {'data': todo})
        const createdAt = todo.createdAt
        for (let attribute in updateRequest) {
            todo[attribute] = updateRequest[attribute]
        }
        await client.update({
            TableName: todosTable,
            Key: {
                userId,
                createdAt,
            },
            UpdateExpression: 'set #todo_name = :name, dueDate = :dueDate, done = :done',
            ConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':name': todo.name,
                ':dueDate': todo.dueDate,
                ':done': todo.done
            },
            ExpressionAttributeNames: {
                '#todo_name': 'name'
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
