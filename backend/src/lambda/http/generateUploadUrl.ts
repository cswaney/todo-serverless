import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
// import * as AWSXRAY from 'aws-xray-sdk'
const AWSXRAY = require('aws-xray-sdk')
const XAWS = AWSXRAY.captureAWS(AWS)

import { createLogger } from '../../utils/logger'

const logger = createLogger('http')
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
  // Get the todoId from path parameters
  const todoId = event.pathParameters.todoId

  // Get a signed URL
  logger.info(`Generating upload url (todoId=${todoId})`)
  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: Number(urlExpiration)
  })
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl
    })
  }
}
