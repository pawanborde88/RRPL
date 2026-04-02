import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  constructor() { }

  /**
   * Encrypts a string value
   * Note: This is a basic implementation. For production, use a proper encryption library.
   * @param value - The value to encrypt
   * @returns The encrypted value
   */
  encrypt(value: string): string {
    if (!value) return '';
    
    // Basic base64 encoding (for demonstration)
    // In production, use proper encryption like AES
    try {
      return btoa(encodeURIComponent(value));
    } catch (error) {
      console.error('Encryption error:', error);
      return value; // Return original value if encryption fails
    }
  }

  /**
   * Decrypts an encrypted string value
   * @param encryptedValue - The encrypted value to decrypt
   * @returns The decrypted value
   */
  decrypt(encryptedValue: string): string {
    if (!encryptedValue) return '';
    
    try {
      return decodeURIComponent(atob(encryptedValue));
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedValue; // Return original value if decryption fails
    }
  }
}











































































