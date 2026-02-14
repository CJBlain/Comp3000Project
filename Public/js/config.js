
const CONTRACT_ADDRESS = "0x7249406F1cB3f840bF04fF550f226b828B13da16";


const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "revokedFrom", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "AccessRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "accessor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "FileAccessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "FileDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sharedWith", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "FileShared",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "fileSize", "type": "uint256"}
    ],
    "name": "FileUploaded",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_fileId", "type": "uint256"}],
    "name": "deleteFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fileCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "files",
    "outputs": [
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "string", "name": "encryptedFilename", "type": "string"},
      {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
      {"internalType": "bool", "name": "isDeleted", "type": "bool"},
      {"internalType": "string", "name": "encryptedKey", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_fileId", "type": "uint256"}],
    "name": "getFile",
    "outputs": [
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "string", "name": "encryptedFilename", "type": "string"},
      {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
      {"internalType": "string", "name": "encryptedKey", "type": "string"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyFiles",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_fileId", "type": "uint256"}],
    "name": "getSharedUsers",
    "outputs": [
      {"internalType": "address[]", "name": "", "type": "address[]"},
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
      {"internalType": "bool[]", "name": "", "type": "bool[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_fileId", "type": "uint256"},
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "isOwner",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_fileId", "type": "uint256"},
      {"internalType": "address", "name": "_revokeFrom", "type": "address"}
    ],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_fileId", "type": "uint256"},
      {"internalType": "address", "name": "_sharedWith", "type": "address"},
      {"internalType": "string", "name": "_encryptedKeyForUser", "type": "string"}
    ],
    "name": "shareFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_ipfsHash", "type": "string"},
      {"internalType": "string", "name": "_encryptedFilename", "type": "string"},
      {"internalType": "uint256", "name": "_fileSize", "type": "uint256"},
      {"internalType": "string", "name": "_encryptedKey", "type": "string"}
    ],
    "name": "uploadFile",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONTRACT_ADDRESS, CONTRACT_ABI };
}