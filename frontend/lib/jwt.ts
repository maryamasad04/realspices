import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-12345';
const ALGORITHM = 'HS256';

interface JWTPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Signs a JWT token
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 7 * 24 * 60 * 60 * 1000): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.floor(expiresIn / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp
  };

  const header = {
    alg: ALGORITHM,
    typ: 'JWT'
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeEqual(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies token from Authorization header
 */
export function verifyAuthHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return verifyToken(parts[1]);
}

/**
 * Helper: Base64url encode
 */
function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Helper: Base64url decode
 */
function base64urlDecode(str: string): string {
  let padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(
    padded.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString();
}

/**
 * Helper: Create HMAC signature
 */
function createSignature(message: string): string {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(message)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Helper: Constant-time string comparison (prevent timing attacks)
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
