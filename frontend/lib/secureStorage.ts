import CryptoJS from "crypto-js";

const SESSION_KEY_NAME = "paymeter_secure_session_key";

/**
 * Generates a strong 256-bit key for AES encryption.
 */
function generateKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
}

/**
 * Retrieves the encryption key strictly from sessionStorage.
 * If it doesn't exist (e.g. new tab or browser restarted), it generates a new one.
 * The key is destroyed the moment the tab is closed, rendering any persisted
 * ciphertexts in localStorage permanently unreadable.
 */
function getEncryptionKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let key = window.sessionStorage.getItem(SESSION_KEY_NAME);

  if (!key) {
    key = generateKey();
    window.sessionStorage.setItem(SESSION_KEY_NAME, key);
  }

  return key;
}

export const SecureStorage = {
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;

    try {
      const encryptionKey = getEncryptionKey();
      const ciphertext = CryptoJS.AES.encrypt(value, encryptionKey).toString();
      window.localStorage.setItem(key, ciphertext);
    } catch (error) {
      console.error("[SecureStorage] Failed to encrypt data", error);
    }
  },

  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;

    try {
      const ciphertext = window.localStorage.getItem(key);
      
      if (!ciphertext) {
        return null;
      }

      // If it looks like raw JSON instead of ciphertext (legacy migration), parse it directly
      // but immediately secure it.
      if (ciphertext.startsWith("{") || ciphertext.startsWith("[")) {
          this.setItem(key, ciphertext);
          return ciphertext;
      }

      const encryptionKey = getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);

      if (!plaintext) {
        window.localStorage.removeItem(key);
        return null;
      }

      return plaintext;
    } catch (error) {
      window.localStorage.removeItem(key);
      return null;
    }
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};
