class IPFSManager {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.pinataBaseUrl = 'https://api.pinata.cloud';
    this.ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  }

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: file.name || 'encrypted-file'
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0
      });
      formData.append('pinataOptions', options);

      const response = await fetch(`${this.pinataBaseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ipfsHash: data.IpfsHash,
        size: data.PinSize,
        timestamp: data.Timestamp
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
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
      const response = await fetch(`${this.pinataBaseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      throw error;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IPFSManager };
}




