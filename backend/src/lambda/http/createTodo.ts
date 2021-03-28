import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
// import { getUserId } from '../utils'
// import { ClientRequest } from 'http'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Log the event...?

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  // TODO: Implement creating a new TODO item
  // Get the userId from the authorization header
  // const userId = getUserId(event)
  const userId = '55fa3605-2082-484a-bd71-4d9ff9fcd8af'  // TODO: placeholder
  // Create the todo item
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const todoRecord = {
    userId,
    createdAt,
    todoId,
    name: newTodo.name,
    dueDate: newTodo.dueDate
  }
  // Put the todo item into dynamodb
  await client.put({
    TableName: todosTable,
    Item: todoRecord
  }).promise()
  // Return response
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      todoRecord,
    })
  }
}
