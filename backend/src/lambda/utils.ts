import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  return parseUserId(jwtToken)
}

/**
 * Get a auth token from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns an auth token from a JWT token
 */
export function getAuthToken(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  return authorization.split(' ')[1]
}
