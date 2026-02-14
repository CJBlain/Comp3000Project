

class EncryptionManager {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  async deriveKeyFromSignature(walletAddress) {
    const message = `SentinelChain Encryption Key for ${walletAddress}`;
    
    const signature = await walletManager.signMessage(message);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(signature);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
    
    return key;
  }

  async encryptFile(file, walletAddress) {
    try {
      const key = await this.deriveKeyFromSignature(walletAddress);
      
      const fileBuffer = await file.arrayBuffer();
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        fileBuffer
      );
      
      const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combinedBuffer.set(iv, 0);
      combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
      
      const encryptedBlob = new Blob([combinedBuffer], { type: 'application/octet-stream' });
      
      const encryptedFilename = await this.encryptString(file.name, walletAddress);
      
      return {
        encryptedFile: encryptedBlob,
        encryptedFilename: encryptedFilename,
        originalSize: file.size
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt file: ' + error.message);
    }
  }

  async decryptFile(encryptedBlob, walletAddress, originalFilename) {
    try {
      const key = await this.deriveKeyFromSignature(walletAddress);
      
      const encryptedBuffer = await encryptedBlob.arrayBuffer();
      const encryptedArray = new Uint8Array(encryptedBuffer);
      
      const iv = encryptedArray.slice(0, 12);
      const data = encryptedArray.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );
      
      const decryptedFilename = await this.decryptString(originalFilename, walletAddress);
      
      return {
        decryptedFile: new Blob([decryptedBuffer]),
        filename: decryptedFilename
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt file. Make sure you\'re using the correct wallet.');
    }
  }

  async encryptString(text, walletAddress) {
    try {
      const key = await this.deriveKeyFromSignature(walletAddress);
      
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );
      
      const combinedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combinedArray.set(iv, 0);
      combinedArray.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return this.arrayBufferToBase64(combinedArray);
    } catch (error) {
      console.error('String encryption failed:', error);
      throw error;
    }
  }

  async decryptString(encryptedText, walletAddress) {
    try {
      const key = await this.deriveKeyFromSignature(walletAddress);
      
      const encryptedArray = this.base64ToArrayBuffer(encryptedText);
      
      const iv = encryptedArray.slice(0, 12);
      const data = encryptedArray.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('String decryption failed:', error);
      throw error;
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

const encryptionManager = new EncryptionManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EncryptionManager, encryptionManager };
}