import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

// import { verify } from 'jsonwebtoken'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://todo-serverless-dev.us.auth0.com/.well-known/jwks.json'

// const cert = `-----BEGIN CERTIFICATE-----
// MIIDGzCCAgOgAwIBAgIJBbXVNEhzB1j5MA0GCSqGSIb3DQEBCwUAMCsxKTAnBgNV
// BAMTIHRvZG8tc2VydmVybGVzcy1kZXYudXMuYXV0aDAuY29tMB4XDTIxMDMyODAx
// NDIxNloXDTM0MTIwNTAxNDIxNlowKzEpMCcGA1UEAxMgdG9kby1zZXJ2ZXJsZXNz
// LWRldi51cy5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// AQC/MFseC6/t1ackkbWLbitSdeHcQbV1kVQ2LruX+ZBFB65RbJMCodKV9OQsdOQW
// 2S/9nyc1WwiAk3gkXo2aYvyHDAZgynECqxLRBafTB1KPhxhCxGd9M4P83gGfDpM3
// YOBiLuY0y1r+uhkL4L0Th8BGkowdON7LZDjtukS9PNbp7vRyqzgN8GDq9D1WA9tx
// LpZLkUAzDlww5mBLat+DctyETnW4mD/9aXmMCt8O2aXmKgtHLInBKpR74OZsspVe
// CWCzTiQQk8uYtDXZwrhEDPU5ZueEjJRzcqORIE6xzd4f5MYrlYvJfo0hrLkfEzyC
// WKpk92UkQBbjQ2xnjiUqgHPbAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYD
// VR0OBBYEFB7FgCooI/IXIeZIFyfMuTd5vtKdMA4GA1UdDwEB/wQEAwIChDANBgkq
// hkiG9w0BAQsFAAOCAQEAuUPDwCdyTaH8w8sePL6DMhLXza/Keg2qSEE1CSf8gtg+
// WSZO7VjbaLMJDwPS75qi2DjIgysIhgdEi/+qN5N5iHa5lEGg19cEL8XsUQ0P0aIo
// ABQxsK6tNO4dOzL+p4f12TSSzGd5cOb3f8me1APqV5DdHvA65mps+jCGS2G6o5JT
// HfQHy/z1uJz2GISPJ9bH37YcD1X+jz8wJn1CaE9f+yGRF//qfngENMw+VKcvw+yA
// MFC5LF80AzlmC90bikHg3lcCd5ETmJW7e9fFL8Rjj7SN1eLM68/kd0viFDOvoS2I
// UN0+BMb2JAWjVEBhR4ofKgbZ77tzL4LhbxwD/jHg7Q==
// -----END CERTIFICATE-----
// `

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)
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
    logger.error('User not authorized', { error: e.message })
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
  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const kid = jwt.header.kid
  console.log(kid)
  const keys = await getJwks()
  console.log(keys)
  // const signingKeys = getSigningKeys(keys)
  // const cert = getSigningKey(signingKeys, kid)
  const signingKey = keys.find(key => key.kid === kid)
  console.log(signingKey)
  const cert = `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----\n`
  console.log(cert)
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

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
  // check for errors
  // ...
  return response.data.keys  // jwks
}

// function getSigningKeys(keys) {
//   if (!keys || !keys.length) {
//     return new Error('The JWKS endpoint did not contain any keys')
//   }

//   const signingKeys = keys
//     .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
//       && key.kty === 'RSA' // We are only supporting RSA (RS256)
//       && key.kid           // The `kid` must be present to be useful for later
//       && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
//     ).map(key => {
//       return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
//     });

//   // If at least one signing key doesn't exist we have a problem... Kaboom.
//   if (!signingKeys.length) {
//     return new Error('The JWKS endpoint did not contain any signature verification keys')
//   }

//   // Returns all of the available signing keys.
//   return signingKeys
// }

// function getSigningKey(keys, kid) {
//   const signingKey = keys.find(key => key.kid === kid);
//   if (!signingKey) {
//     var error = new Error(`Unable to find a signing key that matches '${kid}'`);
//     return error
//   }
//   return signingKey
// }

// function certToPEM(cert) {
//   // let pem = cert.match(/.{1,64}/g).join('\n');
//   // pem = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
//   // return pem;
//   return `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
// }