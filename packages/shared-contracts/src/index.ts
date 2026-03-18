export type SafeCodeRole = 'freelancer_owner' | 'reviewer_admin' | 'client_admin' | 'auditor';

export type StandardError = {
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
};

export type RequestContextHeader = {
  requestId: string;
  tenantId?: string;
  actorUserId?: string;
};