
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3001;


const upload = multer({ storage: multer.memoryStorage() });


app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SentinelChain backend running' });
});


app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        
        if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
            return res.status(500).json({ 
                error: 'Pinata API keys not configured in .env file' 
            });
        }

        
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname || 'encrypted-file',
            contentType: req.file.mimetype
        });

        
        const metadata = JSON.stringify({
            name: req.file.originalname || 'encrypted-file'
        });
        formData.append('pinataMetadata', metadata);

       
        const options = JSON.stringify({
            cidVersion: 0
        });
        formData.append('pinataOptions', options);

        
        const pinataResponse = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        
        res.json({
            success: true,
            ipfsHash: pinataResponse.data.IpfsHash,
            size: pinataResponse.data.PinSize,
            timestamp: pinataResponse.data.Timestamp
        });

    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        
        res.status(500).json({
            error: 'Failed to upload to IPFS',
            details: error.response?.data?.error || error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   SentinelChain Backend Server         ║
║   Running on http://localhost:${PORT}  ║
║                                        ║
║   API Endpoints:                       ║
║   GET  /api/health  - Health check     ║
║   POST /api/upload  - Upload to IPFS   ║
╚════════════════════════════════════════╝
    `);
});