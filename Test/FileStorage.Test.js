const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FileStorage Contract", function () {
  let FileStorage;
  let contract;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    FileStorage = await ethers.getContractFactory("FileStorage");
    contract = await FileStorage.deploy();
    await contract.waitForDeployment();
  });

  describe("File Upload", function () {
    it("Should upload a file successfully", async function () {
      const tx = await contract.uploadFile(
        "QmTest123",
        "encryptedName.txt",
        1024,
        "encryptedKey123"
      );
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "FileUploaded")
        .withArgs(0, owner.address, "QmTest123", block.timestamp, 1024);
      
      const files = await contract.getMyFiles();
      expect(files.length).to.equal(1);
      expect(files[0]).to.equal(0);
    });

    it("Should increment file count", async function () {
      await contract.uploadFile("QmTest1", "file1", 100, "key1");
      await contract.uploadFile("QmTest2", "file2", 200, "key2");
      
      const count = await contract.fileCount();
      expect(count).to.equal(2);
    });

    it("Should fail with empty IPFS hash", async function () {
      await expect(
        contract.uploadFile("", "filename", 100, "key")
      ).to.be.revertedWith("IPFS hash required");
    });

    it("Should fail with empty filename", async function () {
      await expect(
        contract.uploadFile("QmTest", "", 100, "key")
      ).to.be.revertedWith("Filename required");
    });

    it("Should fail with zero file size", async function () {
      await expect(
        contract.uploadFile("QmTest", "filename", 0, "key")
      ).to.be.revertedWith("File size must be greater than 0");
    });
  });

  describe("File Retrieval", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmTest123", "encFile.pdf", 2048, "ownerKey");
    });

    it("Should retrieve file details as owner", async function () {
      const result = await contract.getFile.staticCall(0);
      
      expect(result[0]).to.equal("QmTest123");
      expect(result[1]).to.equal(owner.address);
      expect(result[3]).to.equal("encFile.pdf");
      expect(result[4]).to.equal(2048);
      expect(result[5]).to.equal("ownerKey");
    });

    it("Should emit FileAccessed event", async function () {
      const tx = await contract.getFile(0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "FileAccessed")
        .withArgs(0, owner.address, block.timestamp);
    });

    it("Should fail if file does not exist", async function () {
      await expect(contract.getFile(999))
        .to.be.revertedWith("File does not exist");
    });

    it("Should fail if user has no access", async function () {
      await expect(contract.connect(user1).getFile(0))
        .to.be.revertedWith("No access to this file");
    });

    it("Should fail if file is deleted", async function () {
      await contract.deleteFile(0);
      await expect(contract.getFile(0))
        .to.be.revertedWith("File has been deleted");
    });
  });

  describe("File Sharing", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmShare", "shared.txt", 512, "ownerKey");
    });

    it("Should share file successfully", async function () {
      const tx = await contract.shareFile(0, user1.address, "keyForUser1");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "FileShared")
        .withArgs(0, owner.address, user1.address, block.timestamp);
    });

    it("Should allow shared user to access file", async function () {
      await contract.shareFile(0, user1.address, "keyForUser1");
      
      const result = await contract.connect(user1).getFile.staticCall(0);
      expect(result[0]).to.equal("QmShare");
      expect(result[5]).to.equal("keyForUser1");
    });

    it("Should add file to shared user's file list", async function () {
      await contract.shareFile(0, user1.address, "keyForUser1");
      
      const user1Files = await contract.connect(user1).getMyFiles();
      expect(user1Files.length).to.equal(1);
      expect(user1Files[0]).to.equal(0);
    });

    it("Should fail to share with zero address", async function () {
      await expect(
        contract.shareFile(0, ethers.ZeroAddress, "key")
      ).to.be.revertedWith("Invalid address");
    });

    it("Should fail to share with self", async function () {
      await expect(
        contract.shareFile(0, owner.address, "key")
      ).to.be.revertedWith("Cannot share with yourself");
    });

    it("Should fail to share if not owner", async function () {
      await expect(
        contract.connect(user1).shareFile(0, user2.address, "key")
      ).to.be.revertedWith("Not file owner");
    });

    it("Should fail to share twice with same user", async function () {
      await contract.shareFile(0, user1.address, "key1");
      await expect(
        contract.shareFile(0, user1.address, "key2")
      ).to.be.revertedWith("Already shared with this user");
    });

    it("Should share with multiple users", async function () {
      await contract.shareFile(0, user1.address, "keyForUser1");
      await contract.shareFile(0, user2.address, "keyForUser2");
      
      const result = await contract.getSharedUsers(0);
      expect(result[0].length).to.equal(2);
      expect(result[0][0]).to.equal(user1.address);
      expect(result[0][1]).to.equal(user2.address);
    });
  });

  describe("Access Revocation", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmRevoke", "file.txt", 256, "ownerKey");
      await contract.shareFile(0, user1.address, "keyForUser1");
    });

    it("Should revoke access successfully", async function () {
      const tx = await contract.revokeAccess(0, user1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "AccessRevoked")
        .withArgs(0, owner.address, user1.address, block.timestamp);
    });

    it("Should prevent access after revocation", async function () {
      await contract.revokeAccess(0, user1.address);
      
      await expect(contract.connect(user1).getFile(0))
        .to.be.revertedWith("No access to this file");
    });

    it("Should fail to revoke if not owner", async function () {
      await expect(
        contract.connect(user2).revokeAccess(0, user1.address)
      ).to.be.revertedWith("Not file owner");
    });

    it("Should fail to revoke user without access", async function () {
      await expect(
        contract.revokeAccess(0, user2.address)
      ).to.be.revertedWith("User does not have access");
    });

    it("Should show revocation in shared users list", async function () {
      await contract.revokeAccess(0, user1.address);
      
      const result = await contract.getSharedUsers(0);
      expect(result[0][0]).to.equal(user1.address);
      expect(result[2][0]).to.equal(true);
    });
  });

  describe("File Deletion", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmDelete", "toDelete.txt", 128, "key");
    });

    it("Should delete file successfully", async function () {
      const tx = await contract.deleteFile(0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "FileDeleted")
        .withArgs(0, owner.address, block.timestamp);
    });

    it("Should not show deleted files in user's list", async function () {
      await contract.uploadFile("QmKeep", "keep.txt", 256, "key");
      await contract.deleteFile(0);
      
      const files = await contract.getMyFiles();
      expect(files.length).to.equal(1);
      expect(files[0]).to.equal(1);
    });

    it("Should fail to delete if not owner", async function () {
      await expect(
        contract.connect(user1).deleteFile(0)
      ).to.be.revertedWith("Not file owner");
    });

    it("Should fail to delete already deleted file", async function () {
      await contract.deleteFile(0);
      await expect(contract.deleteFile(0))
        .to.be.revertedWith("File has been deleted");
    });

    it("Should fail to access deleted file", async function () {
      await contract.deleteFile(0);
      await expect(contract.getFile(0))
        .to.be.revertedWith("File has been deleted");
    });
  });

  describe("Get Shared Users", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmShared", "shared.txt", 512, "key");
      await contract.shareFile(0, user1.address, "key1");
      await contract.shareFile(0, user2.address, "key2");
    });

    it("Should return all shared users", async function () {
      const result = await contract.getSharedUsers(0);
      
      expect(result[0].length).to.equal(2);
      expect(result[0][0]).to.equal(user1.address);
      expect(result[0][1]).to.equal(user2.address);
      expect(result[2][0]).to.equal(false);
      expect(result[2][1]).to.equal(false);
    });

    it("Should fail if not owner", async function () {
      await expect(
        contract.connect(user1).getSharedUsers(0)
      ).to.be.revertedWith("Not file owner");
    });
  });

  describe("Owner Check", function () {
    beforeEach(async function () {
      await contract.uploadFile("QmOwner", "file.txt", 128, "key");
    });

    it("Should return true for owner", async function () {
      expect(await contract.isOwner(0, owner.address)).to.equal(true);
    });

    it("Should return false for non-owner", async function () {
      expect(await contract.isOwner(0, user1.address)).to.equal(false);
    });
  });

  describe("Multiple Files", function () {
    it("Should handle multiple files per user", async function () {
      await contract.uploadFile("Qm1", "file1.txt", 100, "key1");
      await contract.uploadFile("Qm2", "file2.txt", 200, "key2");
      await contract.uploadFile("Qm3", "file3.txt", 300, "key3");
      
      const files = await contract.getMyFiles();
      expect(files.length).to.equal(3);
    });

    it("Should handle files from different users", async function () {
      await contract.uploadFile("QmOwner", "owner.txt", 100, "key");
      await contract.connect(user1).uploadFile("QmUser1", "user1.txt", 200, "key");
      
      const ownerFiles = await contract.getMyFiles();
      const user1Files = await contract.connect(user1).getMyFiles();
      
      expect(ownerFiles.length).to.equal(1);
      expect(user1Files.length).to.equal(1);
    });
  });
});