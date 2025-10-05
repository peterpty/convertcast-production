/**
 * AES-256-GCM Encryption Service
 * Used to encrypt/decrypt sensitive API keys and credentials
 *
 * Security Features:
 * - AES-256-GCM symmetric encryption
 * - Unique IV (Initialization Vector) per encryption
 * - Authentication tags for integrity verification
 * - Base64 encoding for database storage
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Encryption algorithm and key length
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variable
 * Uses scrypt key derivation for additional security
 */
function getDerivedKey(salt: Buffer): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY;

  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (masterKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  // Derive a key from the master key using scrypt
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

/**
 * Encrypt a plaintext string
 *
 * @param plaintext - The text to encrypt (API key, token, etc.)
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  try {
    // Generate random salt and IV
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive encryption key
    const key = getDerivedKey(salt);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plaintext
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: salt:iv:authTag:ciphertext
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext,
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 *
 * @param encryptedData - The encrypted string in format: salt:iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  try {
    // Parse the encrypted data
    const parts = encryptedData.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltB64, ivB64, authTagB64, ciphertext] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    // Derive decryption key
    const key = getDerivedKey(salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the ciphertext
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random encryption key
 * This should be run once and stored in environment variables
 *
 * @returns A cryptographically secure random key (base64 encoded)
 */
export function generateEncryptionKey(): string {
  const key = randomBytes(32); // 256 bits
  return key.toString('base64');
}

/**
 * Encrypt multiple fields at once
 * Useful for encrypting all credentials for an integration
 *
 * @param fields - Object with fields to encrypt
 * @returns Object with encrypted values
 */
export function encryptFields(fields: Record<string, string | null | undefined>): Record<string, string | null> {
  const encrypted: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') {
      encrypted[key] = null;
    } else {
      encrypted[key] = encrypt(value);
    }
  }

  return encrypted;
}

/**
 * Decrypt multiple fields at once
 *
 * @param fields - Object with encrypted fields
 * @returns Object with decrypted values
 */
export function decryptFields(fields: Record<string, string | null | undefined>): Record<string, string | null> {
  const decrypted: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') {
      decrypted[key] = null;
    } else {
      try {
        decrypted[key] = decrypt(value);
      } catch (error) {
        console.error(`Failed to decrypt field ${key}:`, error);
        decrypted[key] = null;
      }
    }
  }

  return decrypted;
}

/**
 * Validate that a string can be decrypted
 * Used for testing credentials
 *
 * @param encryptedData - The encrypted string to validate
 * @returns true if valid and can be decrypted, false otherwise
 */
export function isValidEncryptedData(encryptedData: string): boolean {
  try {
    decrypt(encryptedData);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mask a decrypted credential for display purposes
 * Shows first 4 and last 4 characters, masks the rest
 *
 * @param credential - The credential to mask
 * @returns Masked string (e.g., "sk_t••••••••••1234")
 */
export function maskCredential(credential: string): string {
  if (!credential) return '';

  if (credential.length <= 8) {
    return '••••••••';
  }

  const start = credential.substring(0, 4);
  const end = credential.substring(credential.length - 4);
  const masked = '•'.repeat(Math.min(credential.length - 8, 12));

  return `${start}${masked}${end}`;
}

/**
 * Check if encryption is properly configured
 * @returns true if ENCRYPTION_KEY is set and valid
 */
export function isEncryptionConfigured(): boolean {
  try {
    const key = process.env.ENCRYPTION_KEY;
    return !!key && key.length >= 32;
  } catch {
    return false;
  }
}

/**
 * Test encryption/decryption functionality
 * Used for health checks
 *
 * @returns true if encryption is working correctly
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    return decrypted === testData;
  } catch {
    return false;
  }
}
