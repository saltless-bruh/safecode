export { attachRequestContext, authenticateRequest, authorizeRole } from './modules/auth/auth-context.js';
export type {
	AuthContext,
	EntitlementVerifier,
	RequestContext,
	SafeCodeRole,
	StandardError
} from './modules/auth/auth.types.js';