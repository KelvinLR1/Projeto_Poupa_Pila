const crypto = require('node:crypto');
require('dotenv').config();

// Configurações para Criptografia de Senhas do Cofre (AES-256-GCM)
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits recomendado para GCM

// Deriva a chave a partir da chave do .env
const RAW_KEY = process.env.ENCRYPTION_KEY || 'poupa_pila_super_secure_key_32_bytes_long!';
const ENCRYPTION_KEY = crypto.scryptSync(RAW_KEY, 'poupa_pila_salt_for_scrypt', KEY_LENGTH);

/**
 * Criptografa uma string usando AES-256-GCM.
 * Retorna o formato 'iv:authTag:ciphertext' para armazenamento.
 */
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografa uma string em formato 'iv:authTag:ciphertext'.
 * Caso o formato seja inválido ou ocorra um erro, retorna o valor original (compatibilidade).
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  
  // Se não estiver no formato esperado (ex: dados antigos não criptografados), retorna em texto claro
  if (parts.length !== 3) {
    return encryptedText;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error.message);
    // Em caso de erro de chave ou tag, retorna o texto cifrado para evitar travar a aplicação,
    // mas em produção isso significa falha de integridade.
    return '[Erro de Descriptografia]';
  }
}

/**
 * Cria um hash seguro para a senha de login do usuário usando PBKDF2 (SHA-512).
 * Retorna 'salt:hash'
 */
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha fornecida coincide com o hash salvo.
 */
function verifyPassword(password, storedValue) {
  if (!password || !storedValue) return false;
  const parts = storedValue.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword
};
