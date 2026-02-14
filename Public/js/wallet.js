

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  async connect() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      this.account = accounts[0];
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      this.chainId = await this.getChainId();
      
      await this.checkNetwork();
      
      this.setupListeners();
      
      return this.account;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async getChainId() {
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  async checkNetwork() {
    const AMOY_CHAIN_ID = 80002;
    
    if (this.chainId !== AMOY_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }],
        });
        
        this.chainId = await this.getChainId();
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://www.oklink.com/amoy']
              }]
            });
            
            this.chainId = await this.getChainId();
          } catch (addError) {
            throw new Error('Failed to add Polygon Amoy network');
          }
        } else {
          throw new Error('Please switch to Polygon Amoy testnet in MetaMask');
        }
      }
    }
  }

  setupListeners() {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        window.location.reload();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    
    window.location.href = 'index.html';
  }

  isConnected() {
    return this.account !== null;
  }

  getAccount() {
    return this.account;
  }

  getSigner() {
    return this.signer;
  }

  getProvider() {
    return this.provider;
  }

  getShortAddress() {
    if (!this.account) return '';
    return `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
  }

  async signMessage(message) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    return await this.signer.signMessage(message);
  }
}

const walletManager = new WalletManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletManager, walletManager };
}