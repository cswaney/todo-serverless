import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getAuthToken } from '../utils'
import { updateTodo } from '../../api/todos'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const request: UpdateTodoRequest = JSON.parse(event.body)
    const token = getAuthToken(event)
    const todoId = event.pathParameters.todoId
    const item = await updateTodo(todoId, request, token)
    
    if (item) {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                item: item
            })
        }
    } else {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                item: item
            })
        }
    }
}
