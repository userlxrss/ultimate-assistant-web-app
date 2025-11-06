const crypto = require('crypto');

// Secure encryption configuration constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

class SecureEncryptionService {
  constructor() {
    this.currentKeyVersion = 1;
    this.keyCache = new Map();
    this.MAX_CACHE_SIZE = 100;
  }

  deriveKey(password, salt, version = this.currentKeyVersion) {
    const cacheKey = password + "-" + salt.toString('hex') + "-" + version;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    try {
      const key = crypto.scryptSync(password, salt, KEY_LENGTH);
      
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

  generateSalt() {
    return crypto.randomBytes(SALT_LENGTH);
  }

  generateIV() {
    return crypto.randomBytes(IV_LENGTH);
  }

  async encrypt(plaintext, encryptionKey, keyVersion = this.currentKeyVersion) {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Plaintext must be a non-empty string');
      }
      if (!encryptionKey || typeof encryptionKey !== 'string') {
        throw new Error('Encryption key must be a non-empty string');
      }

      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = this.deriveKey(encryptionKey, salt, keyVersion);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('secure-encryption-v1', 'utf8'));

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

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

  async decrypt(encryptedData, encryptionKey) {
    try {
      if (!encryptedData || typeof encryptedData !== 'object') {
        throw new Error('Invalid encrypted data format');
      }
      if (!encryptedData.data || !encryptedData.iv || !encryptedData.salt || !encryptedData.authTag) {
        throw new Error('Missing required encryption components');
      }

      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const key = this.deriveKey(encryptionKey, salt, encryptedData.keyVersion);
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      decipher.setAAD(Buffer.from('secure-encryption-v1', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Decryption failed: Invalid authentication tag - data may be corrupted or tampered with');
      }
      throw new Error("Decryption failed: " + error.message);
    }
  }

  async encryptJSON(data, encryptionKey, keyVersion) {
    try {
      const jsonString = JSON.stringify(data);
      return await this.encrypt(jsonString, encryptionKey, keyVersion);
    } catch (error) {
      throw new Error("JSON encryption failed: " + error.message);
    }
  }

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

  static generateSecurePassword(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
  }

  clearKeyCache() {
    this.keyCache.clear();
  }

  getKeyVersionInfo() {
    return {
      version: this.currentKeyVersion,
      algorithm: 'scrypt (improved)',
      createdAt: new Date()
    };
  }

  static validateKeyStrength(key) {
    const issues = [];
    if (!key) {
      issues.push('Encryption key is required');
    } else {
      if (key.length < 16) issues.push('Encryption key should be at least 16 characters long');
      if (key === 'demo-key-change-in-production' || key === 'default-key-change-in-production') {
        issues.push('Using default/demo encryption key - this is insecure for production');
      }
      if (!/[A-Z]/.test(key)) issues.push('Encryption key should contain uppercase letters');
      if (!/[a-z]/.test(key)) issues.push('Encryption key should contain lowercase letters');
      if (!/[0-9]/.test(key)) issues.push('Encryption key should contain numbers');
      if (!/[^A-Za-z0-9]/.test(key)) issues.push('Encryption key should contain special characters');
    }
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
}

class TokenEncryptionService {
  static async encryptTokens(tokens, encryptionKey) {
    try {
      if (!tokens || typeof tokens !== 'object') {
        throw new Error('Invalid token data');
      }
      const sanitizedTokens = { ...tokens };
      delete sanitizedTokens.code;
      const encryptionService = new SecureEncryptionService();
      return await encryptionService.encryptJSON(sanitizedTokens, encryptionKey);
    } catch (error) {
      throw new Error("Token encryption failed: " + error.message);
    }
  }

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
