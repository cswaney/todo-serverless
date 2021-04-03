import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const client = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const logger = createLogger('http')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  // Parse the request body
  const todoRequest: CreateTodoRequest = JSON.parse(event.body)

  // Get the userId from the authorization header
  const userId = getUserId(event)

  // Create the todo item
  logger.info(`Creating a TODO (userid=${userId})`)
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const todoItem = {
    userId,
    todoId,
    createdAt,
    name: todoRequest.name,
    dueDate: todoRequest.dueDate,
    done: false,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }
  // Put the todo item into dynamodb
  await client.put({
    TableName: todosTable,
    Item: todoItem
  }).promise()
  logger.info('Created a TODO', {'data': todoItem})
  // Return response
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: todoItem,
    })
  }
}
