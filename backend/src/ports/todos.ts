import * as AWS from 'aws-sdk'
// import * as AWSXRAY from 'aws-xray-sdk'
const AWSXRAY = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const XAWS = AWSXRAY.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'

export class Todo {

    constructor(
        private readonly client: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly table = process.env.TODOS_TABLE) {}

    async createTodo(item: TodoItem): Promise<TodoItem> {
        await this.client.put({
            TableName: this.table,
            Item: item
        }).promise()
        return item
    }

    async getTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.client.query({
            TableName: this.table,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        return result.Items as TodoItem[]
    }

    async getTodo(userId: string, todoId: string): Promise<TodoItem> {
        const result = await this.client.query({
            TableName: this.table,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        return result.Items.filter(todo => todo.todoId == todoId)[0] as TodoItem
    }

    async updateTodo(update: TodoItem): Promise<TodoItem> {
        const userId = update.userId
        const createdAt = update.createdAt
        await this.client.update({
            TableName: this.table,
            Key: {
                userId,
                createdAt,
            },
            UpdateExpression: 'set #todo_name = :name, dueDate = :dueDate, done = :done',
            ConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': update.todoId,
                ':name': update.name,
                ':dueDate': update.dueDate,
                ':done': update.done
            },
            ExpressionAttributeNames: {
                '#todo_name': 'name'
            }
        }).promise()
        return update
    }

    async deleteTodo(item: TodoItem): Promise<TodoItem> {
        const userId = item.userId
        const createdAt = item.createdAt
        await this.client.delete({
            TableName: this.table,
            Key: {
                userId,
                createdAt,
            },
            ConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': item.todoId
            }
        }).promise()
        return item
    }

}