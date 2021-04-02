import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'


const logger = createLogger('auth')
const jwksUrl = 'https://todo-serverless-dev.us.auth0.com/.well-known/jwks.json'


export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing user')
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', {'data': jwtToken})
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', {'error': e.message })
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const kid = jwt.header.kid
  const keys = await getJwks()
  const signingKey = keys.find(key => key.kid === kid)
  const cert = `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----\n`
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  // Validate the authentication header
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  // Get the token
  const split = authHeader.split(' ')
  const token = split[1]
  return token
}

async function getJwks() {
  const response = await Axios.get(jwksUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  // TODO: Validate the keys?
  return response.data.keys
}
