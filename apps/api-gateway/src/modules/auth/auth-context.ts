import { createPublicKey, randomUUID, verify } from 'node:crypto';
import {
  AuthorizationError,
  type AuthContext,
  type EntitlementTokenHeader,
  type EntitlementVerifier,
  type RequestContext,
  type SafeCodeRole
} from './auth.types.js';

const AUTH_SCHEME = 'Bearer ';

function decodeBase64Json<T>(value: string): T {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    throw new Error('INVALID_BASE64_JSON');
  }
}

type EntitlementPayload = {
  sub: string;
  tenant_id: string;
  role: SafeCodeRole;
  exp: number;
  jti: string;
  iss?: string;
  aud?: string;
  env?: 'dev' | 'staging' | 'prod';
  nbf?: number;
};

function verifyTokenHeader(tokenParts: string[], context: RequestContext): EntitlementTokenHeader {
  let header: EntitlementTokenHeader;

  try {
    header = decodeBase64Json<EntitlementTokenHeader>(tokenParts[0]);
  } catch {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Malformed entitlement token header', context.requestId);
  }

  if (!header.alg || !header.typ || !header.kid) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token missing required header fields', context.requestId);
  }

  if (header.alg !== 'EdDSA' || header.typ !== 'JWT') {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Unsupported entitlement token header', context.requestId);
  }

  return header;
}

function verifyTokenSignature(
  tokenParts: string[],
  header: EntitlementTokenHeader,
  verifierConfig: EntitlementVerifier,
  context: RequestContext
): void {
  const signingInput = `${tokenParts[0]}.${tokenParts[1]}`;
  const signature = Buffer.from(tokenParts[2], 'base64url');

  let isValid = false;

  try {
    const publicKeyPem = verifierConfig.resolvePublicKey(header.kid);
    const publicKey = createPublicKey(publicKeyPem);
    isValid = verify(null, Buffer.from(signingInput), publicKey, signature);
  } catch {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Unable to verify entitlement token signature', context.requestId);
  }

  if (!isValid) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token signature verification failed', context.requestId);
  }
}

export function attachRequestContext(requestId?: string): RequestContext {
  return {
    requestId: requestId ?? randomUUID(),
    receivedAt: new Date().toISOString()
  };
}

export function authenticateRequest(
  authorizationHeader: string | undefined,
  context: RequestContext,
  verifierConfig: EntitlementVerifier
): AuthContext {
  if (!authorizationHeader || !authorizationHeader.startsWith(AUTH_SCHEME)) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Missing or invalid bearer token', context.requestId);
  }

  const token = authorizationHeader.slice(AUTH_SCHEME.length).trim();
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Malformed entitlement token', context.requestId);
  }

  const header = verifyTokenHeader(tokenParts, context);
  verifyTokenSignature(tokenParts, header, verifierConfig, context);

  let payload: EntitlementPayload;

  try {
    payload = decodeBase64Json<EntitlementPayload>(tokenParts[1]);
  } catch {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Malformed entitlement token payload', context.requestId);
  }

  if (!payload.sub || !payload.tenant_id || !payload.role || !payload.exp || !payload.jti) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token missing required claims', context.requestId);
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.nbf && payload.nbf > now) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token is not yet valid', context.requestId);
  }

  if (payload.exp <= now) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token has expired', context.requestId);
  }

  if (verifierConfig.expectedIssuer && payload.iss !== verifierConfig.expectedIssuer) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token issuer mismatch', context.requestId);
  }

  if (verifierConfig.expectedAudience && payload.aud !== verifierConfig.expectedAudience) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token audience mismatch', context.requestId);
  }

  if (verifierConfig.expectedEnvironment && payload.env !== verifierConfig.expectedEnvironment) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token environment mismatch', context.requestId);
  }

  if (verifierConfig.isRevokedJti && verifierConfig.isRevokedJti(payload.jti)) {
    throw new AuthorizationError(401, 'AUTH_INVALID', 'Entitlement token has been revoked', context.requestId);
  }

  context.actor = {
    userId: payload.sub,
    tenantId: payload.tenant_id,
    role: payload.role
  };

  return context.actor;
}

export function authorizeRole(actor: AuthContext, requiredRoles: SafeCodeRole[], context: RequestContext): void {
  const roleAllowed = requiredRoles.includes(actor.role);
  if (!roleAllowed) {
    throw new AuthorizationError(403, 'AUTH_FORBIDDEN', 'Role not permitted for this action', context.requestId);
  }
}