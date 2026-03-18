export type SafeCodeRole =
  | 'freelancer_owner'
  | 'reviewer_admin'
  | 'client_admin'
  | 'auditor';

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: SafeCodeRole;
};

export type RequestContext = {
  requestId: string;
  receivedAt: string;
  actor?: AuthContext;
};

export type EntitlementTokenHeader = {
  alg: 'EdDSA';
  typ: 'JWT';
  kid: string;
};

export type EntitlementVerifier = {
  resolvePublicKey: (kid: string) => string | Buffer;
  expectedIssuer?: string;
  expectedAudience?: string;
  expectedEnvironment?: 'dev' | 'staging' | 'prod';
  isRevokedJti?: (jti: string) => boolean;
};

export type StandardError = {
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
};

export class AuthorizationError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly requestId: string;

  constructor(statusCode: number, code: string, message: string, requestId: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.requestId = requestId;
  }

  toStandardError(): StandardError {
    return {
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      timestamp: new Date().toISOString()
    };
  }
}