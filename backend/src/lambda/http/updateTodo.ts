import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { getUserId } from '../utils'
// import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // const userId = '55fa3605-2082-484a-bd71-4d9ff9fcd8af'
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    const update = JSON.parse(event.body)
    // const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    logger.info('Updating TODO', todoId)

    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object

    // Query todos
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
        logger.info('Found matching TODO', todo)
        const createdAt = todo.createdAt
        for (let attribute in update) {
            todo[attribute] = update[attribute]
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
