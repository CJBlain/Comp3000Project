

class IPFSManager {
  constructor() {
    this.backendUrl = 'http://localhost:3001';
    this.ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  }

  async uploadFile(file) {
    try {
      
      const formData = new FormData();
      formData.append('file', file);

      
      const response = await fetch(`${this.backendUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      return {
        ipfsHash: data.ipfsHash,
        size: data.size,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Backend server not running. Please start the backend server first.');
      }
      
      throw new Error('Failed to upload to IPFS: ' + error.message);
    }
  }

  async downloadFile(ipfsHash) {
    try {
      const url = `${this.ipfsGateway}${ipfsHash}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      return blob;
    } catch (error) {
      console.error('IPFS download failed:', error);
      throw new Error('Failed to download from IPFS: ' + error.message);
    }
  }

  getGatewayUrl(ipfsHash) {
    return `${this.ipfsGateway}${ipfsHash}`;
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error('Backend server not responding');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      throw new Error('Cannot connect to backend server. Make sure it is running on port 3001.');
    }
  }
}


const ipfsManager = new IPFSManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IPFSManager, ipfsManager };
}
