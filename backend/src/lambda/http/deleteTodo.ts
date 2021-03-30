import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { getUserId } from '../utils'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('event:', event)

    // const userId = '55fa3605-2082-484a-bd71-4d9ff9fcd8af'
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    // const createdAt = '2021-03-28T19:12:48.423Z'

    // Query todos
    const result = await client.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',  // can you add a ConditionExpression to client.query???
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
    const todos = result.Items
    // find the createdAt date of the todo you're looking for...
    const todo = todos.filter(todo => todo.todoId == todoId)[0]
    if (todo) {
        console.log('Found matching todo')
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
        console.log('Unable to find matching todo')
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
