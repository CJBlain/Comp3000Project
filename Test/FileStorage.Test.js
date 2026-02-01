const { expect } = require("chai");

describe("FileStorage", function () {
  it("should upload a file", async function () {
    const FileStorage = await ethers.getContractFactory("FileStorage");
    const c = await FileStorage.deploy();
    await c.waitForDeployment();
    await c.upload("test123");
    const files = await c.getMyFiles();
    expect(files.length).to.equal(1);
  });
});

