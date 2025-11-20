async function main() {
  const FileStorage = await ethers.getContractFactory("FileStorage");
  const contract = await FileStorage.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}
main();