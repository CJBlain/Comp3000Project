// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract FileStorage {
    struct File {
        string ipfsHash;
        address owner;
        uint256 timestamp;
    }

    mapping(uint256 => File) public files;
    mapping(address => uint256[]) public userFiles;
    uint256 public fileCount;

    event FileUploaded(uint256 id, string ipfsHash, address owner);

    function upload(string memory _ipfsHash) public {
        uint256 id = fileCount++;
        files[id] = File(_ipfsHash, msg.sender, block.timestamp);
        userFiles[msg.sender].push(id);
        emit FileUploaded(id, _ipfsHash, msg.sender);
    }

    function getMyFiles() public view returns (uint256[] memory) {
        return userFiles[msg.sender];
    }
}