import * as uuid from 'uuid'

import { Todo } from '../ports/todos'
import { TodoItem } from '../models/TodoItem'
// import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'
import { createLogger } from '../utils/logger'

const port = new Todo()
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const logger = createLogger('http')

export async function createTodo(token: string, request: CreateTodoRequest): Promise<TodoItem> {
    const userId = parseUserId(token)
    const createdAt = new Date().toISOString()
    const todoId = uuid.v4()
    logger.info(`Creating an item (userid=${userId})`)
    const item = await port.createTodo({
        userId: userId,
        todoId: todoId,
        createdAt: createdAt,
        name: request.name,
        dueDate: request.dueDate,
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    })
    logger.info('Created item', { 'data': item })
    return item
}

export async function getTodos(token: string): Promise<TodoItem[]> {
    const userId = parseUserId(token)
    logger.info(`Getting items (userId=${userId})`)
    const items = await port.getTodos(userId)
    logger.info('Found items', { 'data': items })
    return items
}

export async function getTodo(todoId: string, token: string): Promise<TodoItem> {
    const userId = parseUserId(token)
    return await port.getTodo(userId, todoId)
}

export async function updateTodo(todoId: string, request: UpdateTodoRequest, token: string): Promise<TodoItem> {
    logger.info(`Updating item (todoId=${todoId})`)
    const userId = parseUserId(token)
    const item = await port.getTodo(userId, todoId)  // required to get `createdAt` used by update
    for (let attribute in request) {
        item[attribute] = request[attribute]
    }
    if (item) {
        logger.info('Found matching item', { 'data': item })
        return await port.updateTodo(item)
    } else {
        logger.info('Unable to find matching item')
        return item
    }
}

export async function deleteTodo(todoId: string, token: string): Promise<TodoItem> {
    logger.info(`Deleting item (todoId=${todoId})`)
    const userId = parseUserId(token)
    const item = await port.getTodo(userId, todoId)  // required to get `createdAt` used by delete
    if (item) {
        logger.info('Found matching item', { 'data': item })
        return await port.deleteTodo(item)
    } else {
        logger.info('Unable to find matching item')
        return item
    }
}
