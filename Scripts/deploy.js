
async function main() {
  const FileStorage = await ethers.getContractFactory("FileStorage");
  console.log("Deploying FileStorage contract...");

  const contract = await FileStorage.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("FileStorage deployed successfully!");
  console.log("Contract address:", address);
  console.log("Add this address to your app.js → const contractAddress = '" + address + "';");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });