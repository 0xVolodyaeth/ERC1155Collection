// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  const contractURI = "example.com";
  const tokenBaseURI = "tokenuri.com";
  const name = "tokenName";
  const symbol = "tokenSymbol";

  const NFT = await ethers.getContractFactory("LiquidiftyCollectionERC721Master");
  const nftMaster = await NFT.deploy();
  await nftMaster.deployed();

  const SemiFTMaster = await ethers.getContractFactory("LiquidiftyCollectionERC1155Master");
  const semiFTMaster = await SemiFTMaster.deploy();
  await semiFTMaster.deployed();

  console.log("LiquidiftyCollectionERC1155 Master:", semiFTMaster.address);
  console.log("LiquidiftyCollectionERC721 Master:", nftMaster.address);

  const SemiFTFactory = await ethers.getContractFactory("LiquidiftyCollectionERC1155Factory");
  const semiFTFactory = await SemiFTFactory.deploy(semiFTMaster.address);
  await semiFTFactory.deployed();

  const NFTFactory = await ethers.getContractFactory("LiquidiftyCollectionERC721Factory");
  const nftFactory = await NFTFactory.deploy(nftMaster.address);
  await nftFactory.deployed();

  console.log("LiquidiftyCollectionERC1155 Factory:", semiFTFactory.address);
  console.log("LiquidiftyCollectionERC721 Factory:", nftFactory.address);

  const deployer = (await ethers.getSigners())[0].address;

  let tx;
  let res;
  let cloneCreated;

  tx = await semiFTFactory.cloneCollection(
    name,
    symbol,
    tokenBaseURI,
    contractURI,
    deployer
  )
  res = await tx.wait();

  cloneCreated = res.events?.find(e =>
    e.event === "cloneCreated"
  );
  console.log("LiquidiftyCollectionERC1155 clone:", cloneCreated?.args?.cloned);

  tx = await nftFactory.cloneCollection(
    name,
    symbol,
    tokenBaseURI,
    contractURI,
    deployer
  )
  res = await tx.wait();

  cloneCreated = res.events?.find(e =>
    e.event === "cloneCreated"
  );
  console.log("LiquidiftyCollectionERC721 clone:", cloneCreated?.args?.cloned);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
