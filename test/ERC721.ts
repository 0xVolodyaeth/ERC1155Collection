import { expect } from "chai";
import { ethers } from "hardhat";

describe("LC ERC721", function () {

	const getRoyaltiesInterfaceId = "0x0dbdf3f5";
	const ERC721InterfaceId = "0x80ac58cd";

	it("Should deploy nft contract and mint token and burn", async function () {
		const contractURI = "example.com";
		const tokenBaseURI = "tokenuri.com";

		const NFT = await ethers.getContractFactory("LiqudiftyCollectionERC721");
		const nft = await NFT.deploy("TestCollection", "TC", contractURI, tokenBaseURI);
		await nft.deployed();

		const signers = await ethers.getSigners();
		let receiver = signers[2];
		let tokenURI = "/tokenURI";

		let tx = await nft.mint([{
			recipient: signers[1].address,
			value: ethers.BigNumber.from("10")
		}], tokenURI, receiver.address);
		await tx.wait();

		await expect(await nft.tokenURI(0)).equal(tokenBaseURI + tokenURI);
		await expect(await nft.burn(signers[0].address, ethers.BigNumber.from(0))).emit(nft, "Transfer")
			.withArgs(receiver.address, ethers.constants.AddressZero, 0);

		await expect(nft.tokenURI(0))
			.revertedWith("ERC721URIStorage: URI query for nonexistent token");
	})

	it("Should deploy nft contract and mint token and burn", async function () {
		const contractURI = "example.com";
		const tokenBaseURI = "tokenuri.com";

		const NFT = await ethers.getContractFactory("LiqudiftyCollectionERC721");
		const nft = await NFT.deploy("TestCollection", "TC", contractURI, tokenBaseURI);
		await nft.deployed();

		const supportsGetRoyaltiesInterfaceERC721 = await nft.supportsInterface(getRoyaltiesInterfaceId);
		expect(supportsGetRoyaltiesInterfaceERC721).equal(true);
		const supportsERC721Interface = await nft.supportsInterface(ERC721InterfaceId);
		expect(supportsERC721Interface).equal(true);
	})
})