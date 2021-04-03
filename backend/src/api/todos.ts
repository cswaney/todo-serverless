import * as uuid from 'uuid'

import { Todo } from '../ports/todos'
import { TodoItem } from '../models/TodoItem'
// import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const port = new Todo()
const bucketName = process.env.ATTACHMENTS_S3_BUCKET

export async function createTodo(token: string, request: CreateTodoRequest): Promise<TodoItem> {
    const userId = parseUserId(token)
    const createdAt = new Date().toISOString()
    const todoId = uuid.v4()
    return await port.createTodo({
        userId: userId,
        todoId: todoId,
        createdAt: createdAt,
        name: request.name,
        dueDate: request.dueDate,
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    })
}

export async function getTodos(token: string): Promise<TodoItem[]> {
    const userId = parseUserId(token)
    return await port.getTodos(userId)
}

export async function getTodo(todoId: string, token: string): Promise<TodoItem> {
    const userId = parseUserId(token)
    return await port.getTodo(userId, todoId)
}

export async function updateTodo(todoId: string, request: UpdateTodoRequest, token: string): Promise<TodoItem> {
    const userId = parseUserId(token)
    const item = await port.getTodo(userId, todoId)  // required to get `createdAt` used by update
    for (let attribute in request) {
        item[attribute] = request[attribute]
    }
    return await port.updateTodo(item)
}

export async function deleteTodo(todoId: string, token: string): Promise<TodoItem> {
    const userId = parseUserId(token)
    const item = await port.getTodo(userId, todoId)  // required to get `createdAt` used by delete
    return await port.deleteTodo(item)
}
