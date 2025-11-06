const crypto = require('crypto');
const argon2 = require('argon2');

// Secure encryption configuration constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ALGORITHM = 'argon2id';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// Argon2 parameters (OWASP recommended minimums)
const ARGON2_PARAMS = {
  parallelism: 4,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  hashLength: KEY_LENGTH
};

/**
 * Secure encryption service using industry-standard cryptographic practices
 */
class SecureEncryptionService {
  constructor() {
    this.currentKeyVersion = 1;
    this.keyCache = new Map();
    this.MAX_CACHE_SIZE = 100;
  }

  /**
   * Derive encryption key using Argon2id (memory-hard KDF resistant to GPU attacks)
   */
  async deriveKey(password, salt, version = this.currentKeyVersion) {
    const cacheKey = password + "-" + salt.toString('hex') + "-" + version;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    try {
      // Use Argon2id for secure key derivation
      const key = await argon2.hash(password, {
        ...ARGON2_PARAMS,
        salt: salt,
        type: argon2.argon2id,
        raw: true // Return raw bytes instead of encoded string
      });

      // Cache the key (limit cache size)
      if (this.keyCache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.keyCache.keys().next().value;
        this.keyCache.delete(firstKey);
      }
      this.keyCache.set(cacheKey, key);

      return key;
    } catch (error) {
      throw new Error("Key derivation failed: " + error.message);
    }
  }

  /**
   * Generate cryptographically secure random salt
   */
  generateSalt() {
    return crypto.randomBytes(SALT_LENGTH);
  }

  /**
   * Generate cryptographically secure random IV/nonce
   */
  generateIV() {
    return crypto.randomBytes(IV_LENGTH);
  }

  /**
   * Encrypt data with authenticated encryption (AES-256-GCM)
   */
  async encrypt(plaintext, encryptionKey, keyVersion = this.currentKeyVersion) {
    try {
      // Validate inputs
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Plaintext must be a non-empty string');
      }
      if (!encryptionKey || typeof encryptionKey !== 'string') {
        throw new Error('Encryption key must be a non-empty string');
      }

      // Generate random salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Derive encryption key using Argon2id
      const key = await this.deriveKey(encryptionKey, salt, keyVersion);

      // Create cipher with authenticated encryption - FIXED: Use createCipheriv
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('secure-encryption-v1', 'utf8'));

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for integrity verification
      const authTag = cipher.getAuthTag();

      // Return encrypted data with all necessary components for decryption
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        authTag: authTag.toString('hex'),
        keyVersion: keyVersion,
        algorithm: ENCRYPTION_ALGORITHM
      };
    } catch (error) {
      throw new Error("Encryption failed: " + error.message);
    }
  }

  /**
   * Decrypt data with integrity verification
   */
  async decrypt(encryptedData, encryptionKey) {
    try {
      // Validate input structure
      if (!encryptedData || typeof encryptedData !== 'object') {
        throw new Error('Invalid encrypted data format');
      }
      if (!encryptedData.data || !encryptedData.iv || !encryptedData.salt || !encryptedData.authTag) {
        throw new Error('Missing required encryption components');
      }

      // Convert hex strings back to buffers
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Derive the same key used for encryption
      const key = await this.deriveKey(
        encryptionKey, 
        salt, 
        encryptedData.keyVersion
      );

      // Create decipher with authenticated encryption - FIXED: Use createDecipheriv
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      decipher.setAAD(Buffer.from('secure-encryption-v1', 'utf8'));
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Don't expose specific decryption errors for security
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Decryption failed: Invalid authentication tag - data may be corrupted or tampered with');
      }
      throw new Error("Decryption failed: " + error.message);
    }
  }

  /**
   * Encrypt JSON objects safely
   */
  async encryptJSON(data, encryptionKey, keyVersion) {
    try {
      const jsonString = JSON.stringify(data);
      return await this.encrypt(jsonString, encryptionKey, keyVersion);
    } catch (error) {
      throw new Error("JSON encryption failed: " + error.message);
    }
  }

  /**
   * Decrypt JSON objects safely
   */
  async decryptJSON(encryptedData, encryptionKey) {
    try {
      const decryptedString = await this.decrypt(encryptedData, encryptionKey);
      return JSON.parse(decryptedString);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Decrypted data is not valid JSON');
      }
      throw error;
    }
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
  }

  /**
   * Clear key cache for security
   */
  clearKeyCache() {
    this.keyCache.clear();
  }

  /**
   * Get current key version info
   */
  getKeyVersionInfo() {
    return {
      version: this.currentKeyVersion,
      algorithm: KEY_DERIVATION_ALGORITHM,
      createdAt: new Date()
    };
  }

  /**
   * Validate encryption key strength
   */
  static validateKeyStrength(key) {
    const issues = [];

    if (!key) {
      issues.push('Encryption key is required');
    } else {
      if (key.length < 16) {
        issues.push('Encryption key should be at least 16 characters long');
      }
      if (key === 'demo-key-change-in-production' || key === 'default-key-change-in-production') {
        issues.push('Using default/demo encryption key - this is insecure for production');
      }
      if (!/[A-Z]/.test(key)) {
        issues.push('Encryption key should contain uppercase letters');
      }
      if (!/[a-z]/.test(key)) {
        issues.push('Encryption key should contain lowercase letters');
      }
      if (!/[0-9]/.test(key)) {
        issues.push('Encryption key should contain numbers');
      }
      if (!/[^A-Za-z0-9]/.test(key)) {
        issues.push('Encryption key should contain special characters');
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
}

/**
 * Token encryption service specialized for OAuth tokens
 */
class TokenEncryptionService {
  /**
   * Encrypt OAuth tokens with additional security
   */
  static async encryptTokens(tokens, encryptionKey) {
    try {
      // Validate token structure
      if (!tokens || typeof tokens !== 'object') {
        throw new Error('Invalid token data');
      }

      // Remove sensitive fields that shouldn't be stored
      const sanitizedTokens = { ...tokens };
      delete sanitizedTokens.code; // Authorization codes should never be stored

      const encryptionService = new SecureEncryptionService();
      return await encryptionService.encryptJSON(
        sanitizedTokens,
        encryptionKey
      );
    } catch (error) {
      throw new Error("Token encryption failed: " + error.message);
    }
  }

  /**
   * Decrypt OAuth tokens
   */
  static async decryptTokens(encryptedData, encryptionKey) {
    try {
      const encryptionService = new SecureEncryptionService();
      return await encryptionService.decryptJSON(encryptedData, encryptionKey);
    } catch (error) {
      throw new Error("Token decryption failed: " + error.message);
    }
  }
}

module.exports = { SecureEncryptionService, TokenEncryptionService };
