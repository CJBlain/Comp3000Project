let currentTab = 'my-files';

document.addEventListener('DOMContentLoaded', async () => {
    const walletBtn = document.getElementById('wallet-btn');
    const backBtn = document.getElementById('back-btn');
    const helpBtn = document.getElementById('help-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const filesList = document.getElementById('files-list');
    const noFilesMessage = document.getElementById('no-files-message');

    async function checkAndReconnect() {
        try {
            if (!window.ethereum) {
                showError('MetaMask not found. Please install MetaMask.');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return false;
            }

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                await walletManager.connect();
                return true;
            } else {
                showError('Please connect your wallet first');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return false;
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            showError('Failed to connect wallet');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }
    }

    const connected = await checkAndReconnect();
    if (!connected) return;

    walletBtn.textContent = walletManager.getShortAddress();

    await blockchainManager.initialize(walletManager);

    await loadFiles();

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            loadFiles();
        });
    });

    backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    helpBtn.addEventListener('click', () => {
        alert('Download Help\n\nView and download your encrypted files.\nClick Download to decrypt and save a file.');
    });

    walletBtn.addEventListener('click', () => {
        const fullAddress = walletManager.getAccount();
        alert('Your wallet: ' + fullAddress);
    });

    async function loadFiles() {
        try {
            loadingMessage.style.display = 'block';
            filesList.style.display = 'none';
            noFilesMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            filesList.innerHTML = '';

            const fileIds = await blockchainManager.getMyFiles();

            if (fileIds.length === 0) {
                loadingMessage.style.display = 'none';
                noFilesMessage.style.display = 'block';
                return;
            }

            const filePromises = fileIds.map(async (fileId) => {
                try {
                    const fileData = await blockchainManager.getFile(fileId);
                    
                    const decryptedFilename = await encryptionManager.decryptString(
                        fileData.encryptedFilename,
                        walletManager.getAccount()
                    );

                    return {
                        id: fileId,
                        filename: decryptedFilename,
                        size: fileData.fileSize,
                        timestamp: fileData.timestamp,
                        owner: fileData.owner,
                        ipfsHash: fileData.ipfsHash,
                        encryptedKey: fileData.encryptedKey,
                        isOwner: fileData.owner.toLowerCase() === walletManager.getAccount().toLowerCase()
                    };
                } catch (error) {
                    console.error('Failed to load file ' + fileId + ':', error);
                    return null;
                }
            });

            const files = (await Promise.all(filePromises)).filter(f => f !== null);

            loadingMessage.style.display = 'none';

            if (files.length === 0) {
                noFilesMessage.style.display = 'block';
                return;
            }

            const filteredFiles = currentTab === 'my-files' 
                ? files.filter(f => f.isOwner)
                : files.filter(f => !f.isOwner);

            if (filteredFiles.length === 0) {
                noFilesMessage.style.display = 'block';
                return;
            }

            filesList.style.display = 'block';
            filteredFiles.forEach(file => {
                const fileElement = createFileElement(file);
                filesList.appendChild(fileElement);
            });

        } catch (error) {
            console.error('Failed to load files:', error);
            loadingMessage.style.display = 'none';
            showError('Failed to load files. Please refresh the page.');
        }
    }

    function createFileElement(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const date = new Date(file.timestamp * 1000).toLocaleDateString();
        const size = formatFileSize(file.size);
        const ownerShort = shortenAddress(file.owner);

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-item-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-item-name';
        fileName.textContent = file.filename;
        
        const fileMeta = document.createElement('div');
        fileMeta.className = 'file-item-meta';
        fileMeta.textContent = size + ' - ' + date;
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileMeta);

        if (!file.isOwner) {
            const fileOwner = document.createElement('div');
            fileOwner.className = 'file-item-owner';
            fileOwner.textContent = 'Owner: ' + ownerShort;
            fileInfo.appendChild(fileOwner);
        }

        const fileActions = document.createElement('div');
        fileActions.className = 'file-item-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'file-action-btn download';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => downloadFile(file));

        fileActions.appendChild(downloadBtn);

        if (file.isOwner) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'file-action-btn share';
            shareBtn.textContent = 'Share';
            shareBtn.addEventListener('click', () => shareFile(file));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'file-action-btn delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteFile(file));

            fileActions.appendChild(shareBtn);
            fileActions.appendChild(deleteBtn);
        }

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileActions);

        return fileItem;
    }

    async function downloadFile(file) {
        try {
            const downloadBtn = event.target;
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Downloading...';

            const encryptedBlob = await ipfsManager.downloadFile(file.ipfsHash);
            
            const decryptedResult = await encryptionManager.decryptFile(
                encryptedBlob,
                file.filename,
                walletManager.getAccount()
            );

            const url = window.URL.createObjectURL(decryptedResult.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = decryptedResult.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download';

        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed: ' + error.message);
            event.target.disabled = false;
            event.target.textContent = 'Download';
        }
    }

    async function shareFile(file) {
        const recipientAddress = prompt('Enter recipient wallet address:');
        
        if (!recipientAddress) return;

        if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
            alert('Invalid wallet address');
            return;
        }

        try {
            await blockchainManager.shareFile(file.id, recipientAddress, file.encryptedKey);
            alert('File shared successfully with ' + recipientAddress);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Share failed: ' + error.message);
        }
    }

    async function deleteFile(file) {
        if (!confirm('Are you sure you want to delete "' + file.filename + '"?')) {
            return;
        }

        try {
            await blockchainManager.deleteFile(file.id);
            alert('File deleted successfully');
            loadFiles();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Delete failed: ' + error.message);
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        loadingMessage.style.display = 'none';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    function shortenAddress(address) {
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
});