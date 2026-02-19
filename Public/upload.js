let selectedFile = null;

document.addEventListener('DOMContentLoaded', async () => {
    const walletBtn = document.getElementById('wallet-btn');
    const backBtn = document.getElementById('back-btn');
    const helpBtn = document.getElementById('help-btn');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const uploadBtn = document.getElementById('upload-btn');
    const progressContainer = document.getElementById('progress-container');
    const messageDiv = document.getElementById('message');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    async function checkAndReconnect() {
        try {
            if (!window.ethereum) {
                showMessage('MetaMask not found. Please install MetaMask.', true);
                setTimeout(() => window.location.href = 'index.html', 2000);
                return false;
            }

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                await walletManager.connect();
                return true;
            } else {
                showMessage('Please connect your wallet first', true);
                setTimeout(() => window.location.href = 'index.html', 2000);
                return false;
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            showMessage('Failed to connect wallet', true);
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }
    }

    const connected = await checkAndReconnect();
    if (!connected) return;

    walletBtn.textContent = walletManager.getShortAddress();

    await blockchainManager.initialize(walletManager);

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.style.display = 'block';
            uploadBtn.style.display = 'inline-block';
            messageDiv.style.display = 'none';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        progressContainer.style.display = 'block';
        messageDiv.style.display = 'none';

        try {
            step1.classList.add('active');
            const encrypted = await encryptionManager.encryptFile(
                selectedFile,
                walletManager.getAccount()
            );
            step1.classList.remove('active');
            step1.classList.add('complete');
            step1.textContent = 'Step 1: File encrypted successfully';

            step2.classList.add('active');
            const ipfsResult = await ipfsManager.uploadFile(encrypted.encryptedFile);
            step2.classList.remove('active');
            step2.classList.add('complete');
            step2.textContent = 'Step 2: Uploaded to IPFS successfully';

            step3.classList.add('active');
            const blockchainResult = await blockchainManager.uploadFile(
                ipfsResult.ipfsHash,
                encrypted.encryptedFilename,
                encrypted.originalSize,
                encrypted.encryptedFilename
            );
            step3.classList.remove('active');
            step3.classList.add('complete');
            step3.textContent = 'Step 3: Registered on blockchain successfully';

            showMessage('File uploaded successfully! File ID: ' + blockchainResult.fileId, false);
            uploadBtn.textContent = 'Upload Complete';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 3000);

        } catch (error) {
            console.error('Upload failed:', error);
            
            if (step1.classList.contains('active')) {
                step1.classList.remove('active');
                step1.classList.add('error');
                step1.textContent = 'Step 1: Encryption failed';
            } else if (step2.classList.contains('active')) {
                step2.classList.remove('active');
                step2.classList.add('error');
                step2.textContent = 'Step 2: IPFS upload failed';
            } else if (step3.classList.contains('active')) {
                step3.classList.remove('active');
                step3.classList.add('error');
                step3.textContent = 'Step 3: Blockchain registration failed';
            }

            showMessage('Upload failed: ' + error.message, true);
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Try Again';
        }
    });

    backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    helpBtn.addEventListener('click', () => {
        alert('Upload Help\n\nSelect a file to encrypt and upload to IPFS.\nThe file will be registered on the blockchain.');
    });

    walletBtn.addEventListener('click', () => {
        const fullAddress = walletManager.getAccount();
        alert('Your wallet: ' + fullAddress);
    });

    function showMessage(msg, isError) {
        messageDiv.textContent = msg;
        messageDiv.className = 'message ' + (isError ? 'error' : 'success');
        messageDiv.style.display = 'block';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
});