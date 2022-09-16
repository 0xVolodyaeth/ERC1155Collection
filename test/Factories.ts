
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Factories for ERC1155 and ERC721", function () {
	it("Should deploy nft contract and create clones", async function () {
		const accs = await ethers.getSigners();
		const creator = accs[2];
		const contractURI = "example.com";
		const tokenBaseURI = "token.com";

		const NFTMaster = await ethers.getContractFactory("LiquidiftyCollectionERC721Master");
		const nftMaster = await NFTMaster.deploy();
		await nftMaster.deployed();

		const NFTFactory = await ethers.getContractFactory("LiquidiftyCollectionERC721Factory");
		const nftFactory = await NFTFactory.deploy(nftMaster.address);
		await nftFactory.deployed();

		// first clone
		let name = "firstName";
		let symbol = "firstSymbol";
		let firstBaseURI = "/firstCloneTokenURI";

		let tx = await nftFactory.cloneCollection(name, symbol, contractURI, tokenBaseURI, creator.address);
		let reciept = await tx.wait();

		let firstCloneAddress = reciept.events![2].args![0];

		// second clone
		name = "secondName";
		symbol = "secondSymbol";
		let secondBaseURI = "/secondCloneTokenURI";
		tx = await nftFactory.cloneCollection(name, symbol, contractURI, tokenBaseURI, creator.address);
		reciept = await tx.wait();

		let secondCloneAddress = reciept.events![2].args![0];

		let receiver = accs[3];
		let firstClone = await NFTMaster.attach(firstCloneAddress);
		tx = await firstClone.connect(creator).mint([{
			recipient: receiver.address,
			value: ethers.BigNumber.from("10")
		}], firstBaseURI, ethers.constants.AddressZero);
		await tx.wait();

		let secondClone = await NFTMaster.attach(secondCloneAddress);
		tx = await secondClone.connect(creator).mint([{
			recipient: receiver.address,
			value: ethers.BigNumber.from("10")

		}], secondBaseURI, ethers.constants.AddressZero);
		await tx.wait();

		let firsctCloneMintedNFT = await firstClone.tokenURI(0);
		expect(firsctCloneMintedNFT).equal(tokenBaseURI + firstBaseURI);

		let secondCloneMintedNFT = await secondClone.tokenURI(0);
		expect(secondCloneMintedNFT).equal(tokenBaseURI + secondBaseURI);
	})

	it("Should deploy master, factory, create two clones", async function () {
		const accs = await ethers.getSigners();
		const feeRecipient = accs[1];
		const supply = 100;
		const creator = accs[2];
		const tokenId = 0;

		let tx;
		let cloneName;
		let cloneSymbol;
		let cloneURI;
		let collectionURI;
		let tokenBaseURI;

		const LC = await ethers.getContractFactory("LiquidiftyCollectionERC1155Master");
		let lc = await LC.deploy();
		await lc.deployed();

		const LCF = await ethers.getContractFactory("LiquidiftyCollectionERC1155Factory");
		let factory = await LCF.deploy(lc.address);
		await factory.deployed();

		// first clone
		cloneName = "cloneName1";
		cloneSymbol = "CN1";
		cloneURI = "/cloneURI1";
		tokenBaseURI = "tokenBaseURI";
		collectionURI = "collectionURI";

		tx = await factory.cloneCollection(cloneName, cloneSymbol, collectionURI, tokenBaseURI, creator.address);
		await tx.wait()

		let eventFilter = factory.filters.cloneCreated();
		let cloneEvent = await factory.queryFilter(eventFilter);

		let cloneAddress = cloneEvent[0]?.args?.cloned;
		let clone = await LC.attach(cloneAddress);

		expect(await clone.name()).equal(cloneName);
		await expect(clone.connect(creator).mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from("20")
			}],
			ethers.BigNumber.from(supply),
			cloneURI,
			ethers.constants.AddressZero,
		))
			.to.emit(clone, "SecondarySaleFees")
			.withArgs(0, [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(clone, "URI")
			.withArgs(tokenBaseURI + cloneURI, tokenId);

		// second clone
		cloneName = "cloneName2";
		cloneSymbol = "CN2";
		cloneURI = "/cloneURI2";
		tokenBaseURI = "tokenBaseURI2";
		collectionURI = "collectionURI2";

		tx = await factory.cloneCollection(cloneName, cloneSymbol, collectionURI, tokenBaseURI, creator.address);
		await tx.wait()

		eventFilter = factory.filters.cloneCreated();
		cloneEvent = await factory.queryFilter(eventFilter);

		cloneAddress = cloneEvent[1]?.args?.cloned;
		clone = await LC.attach(cloneAddress);

		expect(await clone.name()).equal(cloneName);
		await expect(clone.connect(creator).mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from("20")
			}],
			ethers.BigNumber.from(supply),
			cloneURI,
			ethers.constants.AddressZero,
		))
			.to.emit(clone, "SecondarySaleFees")
			.withArgs(1, [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(clone, "URI")
			.withArgs(tokenBaseURI + cloneURI, tokenId);
	});
})