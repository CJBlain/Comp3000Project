class BlockchainManager {
  constructor() {
    this.contract = null;
    this.provider = null;
  }

  async initialize(walletManager) {
    try {
      this.provider = walletManager.getProvider();
      const signer = walletManager.getSigner();
      
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      
      return this.contract;
    } catch (error) {
      console.error('Failed to initialize blockchain manager:', error);
      throw error;
    }
  }

  async uploadFile(ipfsHash, encryptedFilename, fileSize, encryptedKey) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.uploadFile(
        ipfsHash,
        encryptedFilename,
        fileSize,
        encryptedKey,
        { gasPrice: ethers.parseUnits('30', 'gwei') }
      );

      const receipt = await tx.wait();
      
      const uploadEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'FileUploaded'
      );

      const fileId = uploadEvent ? uploadEvent.args[0] : null;

      return {
        fileId: fileId ? Number(fileId) : null,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Upload to blockchain failed:', error);
      throw new Error('Failed to register file on blockchain: ' + error.message);
    }
  }

  async getFile(fileId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const result = await this.contract.getFile.staticCall(fileId);

      return {
        ipfsHash: result[0],
        owner: result[1],
        timestamp: Number(result[2]),
        encryptedFilename: result[3],
        fileSize: Number(result[4]),
        encryptedKey: result[5]
      };
    } catch (error) {
      console.error('Failed to get file from blockchain:', error);
      throw new Error('Failed to retrieve file details: ' + error.message);
    }
  }

  async getMyFiles() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const fileIds = await this.contract.getMyFiles();
      
      return fileIds.map(id => Number(id));
    } catch (error) {
      console.error('Failed to get user files:', error);
      throw new Error('Failed to retrieve your files: ' + error.message);
    }
  }

  async shareFile(fileId, recipientAddress, encryptedKeyForRecipient) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.shareFile(
        fileId,
        recipientAddress,
        encryptedKeyForRecipient,
        { gasPrice: ethers.parseUnits('30', 'gwei') }
      );

      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to share file:', error);
      throw new Error('Failed to share file: ' + error.message);
    }
  }

  async revokeAccess(fileId, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.revokeAccess(
        fileId,
        userAddress,
        { gasPrice: ethers.parseUnits('30', 'gwei') }
      );
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to revoke access:', error);
      throw new Error('Failed to revoke access: ' + error.message);
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.deleteFile(
        fileId,
        { gasPrice: ethers.parseUnits('30', 'gwei') }
      );
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file: ' + error.message);
    }
  }

  async getSharedUsers(fileId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const result = await this.contract.getSharedUsers(fileId);

      const users = [];
      for (let i = 0; i < result[0].length; i++) {
        users.push({
          address: result[0][i],
          timestamp: Number(result[1][i]),
          isRevoked: result[2][i]
        });
      }

      return users;
    } catch (error) {
      console.error('Failed to get shared users:', error);
      throw new Error('Failed to retrieve shared users: ' + error.message);
    }
  }

  async isOwner(fileId, userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      return await this.contract.isOwner(fileId, userAddress);
    } catch (error) {
      console.error('Failed to check ownership:', error);
      throw error;
    }
  }

  async getFileCount() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const count = await this.contract.fileCount();
      return Number(count);
    } catch (error) {
      console.error('Failed to get file count:', error);
      throw error;
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  shortenAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  }
}

const blockchainManager = new BlockchainManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockchainManager, blockchainManager };
}