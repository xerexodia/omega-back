import { Injectable } from "@nestjs/common";
import * as CryptoJS from "crypto-js";
import { pbkdf2Sync } from "crypto";

@Injectable()
export class EncryptionService {
  private readonly salt = process.env.ENCRYPTION_SALT || "d4fF8gT@2k!m1e#z";
  private readonly iterations = 10000;
  private readonly keyLength = 32;

  /**
   * Derives a 256-bit encryption key from a password
   */
  deriveKeyFromPassword(password: string): CryptoJS.lib.WordArray {
    const keyBuffer = pbkdf2Sync(
      password,
      this.salt,
      this.iterations,
      this.keyLength,
      "sha256"
    );
    return CryptoJS.lib.WordArray.create(keyBuffer);
  }

  /**
   * Encrypts plain text with a derived key
   */
  encrypt(text: string, key: CryptoJS.lib.WordArray): string {
    // Convert text to WordArray
    const textWordArray = CryptoJS.enc.Utf8.parse(text);

    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // Encrypt with explicit parameters
    const encrypted = CryptoJS.AES.encrypt(textWordArray, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Combine IV and ciphertext (IV is needed for decryption)
    return iv.toString() + encrypted.toString();
  }

  /**
   * Decrypts encrypted text with a derived key
   */
  decrypt(encryptedText: string, key: CryptoJS.lib.WordArray): string {
    // Extract IV (first 32 hex characters)
    const iv = CryptoJS.enc.Hex.parse(encryptedText.substring(0, 32));
    const ciphertext = encryptedText.substring(32);

    // Decrypt with same parameters
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
