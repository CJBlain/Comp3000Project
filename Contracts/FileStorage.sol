// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FileStorage {
    
    struct File {
        string ipfsHash;
        address owner;
        uint256 timestamp;
        string encryptedFilename;
        uint256 fileSize;
        bool isDeleted;
        string encryptedKey;
    }
    
    struct SharedAccess {
        address sharedWith;
        uint256 timestamp;
        string encryptedKey;
        bool isRevoked;
    }
    
    mapping(uint256 => File) public files;
    mapping(address => uint256[]) private userFiles;
    mapping(uint256 => SharedAccess[]) private fileShares;
    mapping(uint256 => mapping(address => uint256)) private shareIndex;
    
    uint256 public fileCount;
    
    event FileUploaded(
        uint256 indexed fileId,
        address indexed owner,
        string ipfsHash,
        uint256 timestamp,
        uint256 fileSize
    );
    
    event FileAccessed(
        uint256 indexed fileId,
        address indexed accessor,
        uint256 timestamp
    );
    
    event FileShared(
        uint256 indexed fileId,
        address indexed owner,
        address indexed sharedWith,
        uint256 timestamp
    );
    
    event AccessRevoked(
        uint256 indexed fileId,
        address indexed owner,
        address indexed revokedFrom,
        uint256 timestamp
    );
    
    event FileDeleted(
        uint256 indexed fileId,
        address indexed owner,
        uint256 timestamp
    );
    
    modifier onlyOwner(uint256 _fileId) {
        require(files[_fileId].owner == msg.sender, "Not file owner");
        _;
    }
    
    modifier fileExists(uint256 _fileId) {
        require(_fileId < fileCount, "File does not exist");
        _;
    }
    
    modifier fileNotDeleted(uint256 _fileId) {
        require(!files[_fileId].isDeleted, "File has been deleted");
        _;
    }
    
    modifier hasAccess(uint256 _fileId) {
        require(
            files[_fileId].owner == msg.sender || _hasSharedAccess(_fileId, msg.sender),
            "No access to this file"
        );
        _;
    }
    
    function uploadFile(
        string memory _ipfsHash,
        string memory _encryptedFilename,
        uint256 _fileSize,
        string memory _encryptedKey
    ) public returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(bytes(_encryptedFilename).length > 0, "Filename required");
        require(_fileSize > 0, "File size must be greater than 0");
        
        uint256 fileId = fileCount++;
        
        files[fileId] = File({
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            encryptedFilename: _encryptedFilename,
            fileSize: _fileSize,
            isDeleted: false,
            encryptedKey: _encryptedKey
        });
        
        userFiles[msg.sender].push(fileId);
        
        emit FileUploaded(fileId, msg.sender, _ipfsHash, block.timestamp, _fileSize);
        
        return fileId;
    }
    
    function getFile(uint256 _fileId) 
        public 
        fileExists(_fileId)
        fileNotDeleted(_fileId)
        hasAccess(_fileId)
        returns (
            string memory ipfsHash,
            address owner,
            uint256 timestamp,
            string memory encryptedFilename,
            uint256 fileSize,
            string memory encryptedKey
        ) 
    {
        File memory file = files[_fileId];
        
        if (file.owner == msg.sender) {
            encryptedKey = file.encryptedKey;
        } else {
            encryptedKey = _getSharedKey(_fileId, msg.sender);
        }
        
        emit FileAccessed(_fileId, msg.sender, block.timestamp);
        
        return (
            file.ipfsHash,
            file.owner,
            file.timestamp,
            file.encryptedFilename,
            file.fileSize,
            encryptedKey
        );
    }
    
    function shareFile(
        uint256 _fileId,
        address _sharedWith,
        string memory _encryptedKeyForUser
    ) 
        public 
        fileExists(_fileId)
        fileNotDeleted(_fileId)
        onlyOwner(_fileId)
    {
        require(_sharedWith != address(0), "Invalid address");
        require(_sharedWith != msg.sender, "Cannot share with yourself");
        require(!_hasSharedAccess(_fileId, _sharedWith), "Already shared with this user");
        require(bytes(_encryptedKeyForUser).length > 0, "Encrypted key required");
        
        SharedAccess memory newShare = SharedAccess({
            sharedWith: _sharedWith,
            timestamp: block.timestamp,
            encryptedKey: _encryptedKeyForUser,
            isRevoked: false
        });
        
        uint256 index = fileShares[_fileId].length;
        fileShares[_fileId].push(newShare);
        shareIndex[_fileId][_sharedWith] = index;
        
        userFiles[_sharedWith].push(_fileId);
        
        emit FileShared(_fileId, msg.sender, _sharedWith, block.timestamp);
    }
    
    function revokeAccess(
        uint256 _fileId,
        address _revokeFrom
    ) 
        public 
        fileExists(_fileId)
        onlyOwner(_fileId)
    {
        require(_hasSharedAccess(_fileId, _revokeFrom), "User does not have access");
        
        uint256 index = shareIndex[_fileId][_revokeFrom];
        fileShares[_fileId][index].isRevoked = true;
        
        emit AccessRevoked(_fileId, msg.sender, _revokeFrom, block.timestamp);
    }
    
    function deleteFile(uint256 _fileId) 
        public 
        fileExists(_fileId)
        fileNotDeleted(_fileId)
        onlyOwner(_fileId)
    {
        files[_fileId].isDeleted = true;
        
        emit FileDeleted(_fileId, msg.sender, block.timestamp);
    }
    
    function getMyFiles() public view returns (uint256[] memory) {
        uint256[] memory allFiles = userFiles[msg.sender];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allFiles.length; i++) {
            if (!files[allFiles[i]].isDeleted) {
                activeCount++;
            }
        }
        
        uint256[] memory activeFiles = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allFiles.length; i++) {
            if (!files[allFiles[i]].isDeleted) {
                activeFiles[currentIndex] = allFiles[i];
                currentIndex++;
            }
        }
        
        return activeFiles;
    }
    
    function getSharedUsers(uint256 _fileId) 
        public 
        view 
        fileExists(_fileId)
        onlyOwner(_fileId)
        returns (address[] memory, uint256[] memory, bool[] memory) 
    {
        SharedAccess[] memory shares = fileShares[_fileId];
        
        address[] memory users = new address[](shares.length);
        uint256[] memory timestamps = new uint256[](shares.length);
        bool[] memory revoked = new bool[](shares.length);
        
        for (uint256 i = 0; i < shares.length; i++) {
            users[i] = shares[i].sharedWith;
            timestamps[i] = shares[i].timestamp;
            revoked[i] = shares[i].isRevoked;
        }
        
        return (users, timestamps, revoked);
    }
    
    function isOwner(uint256 _fileId, address _user) 
        public 
        view 
        fileExists(_fileId)
        returns (bool) 
    {
        return files[_fileId].owner == _user;
    }
    
    function _hasSharedAccess(uint256 _fileId, address _user) internal view returns (bool) {
        if (shareIndex[_fileId][_user] >= fileShares[_fileId].length) {
            return false;
        }
        
        uint256 index = shareIndex[_fileId][_user];
        SharedAccess memory share = fileShares[_fileId][index];
        
        return share.sharedWith == _user && !share.isRevoked;
    }
    
    function _getSharedKey(uint256 _fileId, address _user) internal view returns (string memory) {
        require(_hasSharedAccess(_fileId, _user), "No shared access");
        
        uint256 index = shareIndex[_fileId][_user];
        return fileShares[_fileId][index].encryptedKey;
    }
}