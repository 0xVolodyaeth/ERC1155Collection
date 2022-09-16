import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { LiquidiftyCollectionERC1155 } from "../typechain";

describe("LC ERC1155", function () {
	let lc: LiquidiftyCollectionERC1155;
	let signer: SignerWithAddress;
	let accs: SignerWithAddress[];

	const contractURI = "example.com";
	const tokenBaseURI = "tokenuri.com";
	const zeroAddress = "0x0000000000000000000000000000000000000000";

	const getRoyaltiesInterfaceId = "0x0dbdf3f5";
	const ERC1155InterfaceId = "0xd9b67a26";

	beforeEach("deploy", async function () {
		[signer, ...accs] = await ethers.getSigners();

		const LC = await ethers.getContractFactory("LiquidiftyCollectionERC1155");
		lc = await LC.deploy("TestCollection", "TC", contractURI, tokenBaseURI);
		await lc.deployed();
	});

	it("Should mint a new token for msg.sender, get uri, and burn the token", async function () {
		const tokenURI = "/tokenuri";
		const feeRecipient = accs[1];
		const tokenId = "0";
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from("20")
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			zeroAddress,
		))
			.to.emit(lc, "SecondarySaleFees")
			.withArgs("0", [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenURI, tokenId);

		const uri = await lc.uri(parseInt(tokenId));
		expect(uri).to.be.a("string");
		expect(uri).to.equal(tokenBaseURI + tokenURI);

		const supplyfromContract: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));

		const amountToBurn = ethers.BigNumber.from(10);

		await expect(lc.burn(signer.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.to.emit(lc, "TransferSingle")
			.withArgs(signer.address, signer.address, zeroAddress, ethers.BigNumber.from(tokenId), ethers.BigNumber.from("10"));

		const supplyfromContractAfterBurn: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContractAfterBurn.toNumber()).equal(supplyfromContract.sub(amountToBurn).toNumber());
	});

	it("Should mint a new token for someone's address and burn it", async function () {
		const tokenURI = "example.com";
		const feeRecipient = accs[1];
		const tokenId = "0";
		const tokenAmount = "100";
		const creator = accs[2];

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from("20")
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			creator.address,
		))
			.to.emit(lc, "SecondarySaleFees")
			.withArgs(0, [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenURI, tokenId);

		const supplyfromContract: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContract.toString()).equal(tokenAmount);

		const amountToBurn = ethers.BigNumber.from(10);

		await expect(lc.connect(creator).burn(creator.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.to.emit(lc, "TransferSingle")
			.withArgs(creator.address, creator.address, zeroAddress, ethers.BigNumber.from(tokenId), ethers.BigNumber.from("10"));

		const supplyfromContractAfterBurn: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContractAfterBurn.toNumber()).equal(supplyfromContract.sub(amountToBurn).toNumber());
	});

	it("Should mint and get royalties", async function () {
		const tokenURI = "/tokenuri";
		const feeRecipient = accs[1];
		const tokenId = "0";
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from("20")
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.to.emit(lc, "SecondarySaleFees")
			.withArgs(1, [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenURI, tokenId);

		const supplyfromContract: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContract.toString()).equal(tokenAmount);

		const feeRecipients: string[] = await lc.getFeeRecipients(ethers.BigNumber.from(tokenId));
		expect(feeRecipients[0]).equal(feeRecipient.address);

		const getFeeBpsResponse: BigNumber[] = await lc.getFeeBps(ethers.BigNumber.from(tokenId));
		expect(getFeeBpsResponse[0].toNumber()).equal(20);

		const getRoyaltiesResponse: [string[], BigNumber[]] = await lc.getRoyalties(ethers.BigNumber.from(tokenId));
		expect(getRoyaltiesResponse[0][0]).equal(feeRecipient.address);
		expect(getRoyaltiesResponse[1][0].toNumber()).equal(20);
	});

	it("Should change contractURI", async function () {
		const newContractURI = "new_contract_uri";
		await lc.setContractURI(newContractURI)

		const newUri = await lc.contractURI();
		expect(newUri).equal(newContractURI);
	});

	it("Should mint a new token without fees", async function () {
		const tokenURI = "/tokenURI";
		const feeRecipient = accs[1];
		const tokenId = "0";
		const tokenAmount = "100";

		await expect(lc.mint(
			[],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.to.emit(lc, "SecondarySaleFees")
			.withArgs(0, [feeRecipient.address], [ethers.BigNumber.from("20")])
			.to.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenURI, tokenId);

		const uri = await lc.uri(parseInt(tokenId));
		expect(uri).to.be.a("string");
		expect(uri).to.equal(tokenBaseURI + tokenURI);

		const getRoyaltiesResponse: [string[], BigNumber[]] = await lc.getRoyalties(ethers.BigNumber.from(tokenId));
		expect(getRoyaltiesResponse).length(2)
		expect(getRoyaltiesResponse[0]).length(0)
		expect(getRoyaltiesResponse[1]).length(0)
	});

	it("Should mint a new token with negative supply", async function () {
		const tokenURI = "/tokenURI";
		const tokenAmount = "0";

		await expect(lc.mint(
			[],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.revertedWith("Supply should be positive");
	});

	it("Should mint a new token with empty token uri", async function () {
		const tokenURI = "";
		const tokenAmount = "10";

		await expect(lc.mint(
			[],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.revertedWith("URI should be set");
	});

	it("Should mint a new token with zeroaddress fee recipient", async function () {
		const tokenURI = "/tokenURI";
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: zeroAddress,
				value: ethers.BigNumber.from(20)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.revertedWith("Recipient should be present");
	});

	it("Should mint a new token with zero fee value recipient", async function () {
		const tokenURI = "/tokenURI";
		const feeRecipient = accs[1];
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from(0)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.revertedWith("Fee value should be positive");
	});

	it("Should mint a new token with zero fee value recipient", async function () {
		const tokenURI = "/tokenURI";
		const feeRecipient = accs[1];
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from(0)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenURI,
			signer.address,
		))
			.revertedWith("Fee value should be positive");
	});

	it("Should mint a new token with zero fee value recipient", async function () {
		const tokenUri = "/tokenUri";
		const feeRecipient = accs[1];
		const tokenAmount = "100";

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from(0)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenUri,
			signer.address,
		))
			.revertedWith("Fee value should be positive");
	});

	it("Should mint a new token and burn it with 3rd-party approval", async function () {
		const tokenUri = "/tokenUri";
		const feeRecipient = accs[1];
		const tokenAmount = 100;
		const tokenId = 0;

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from(10)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenUri,
			zeroAddress
		))
			.emit(lc, "SecondarySaleFees")
			.withArgs(1, [feeRecipient.address], [ethers.BigNumber.from(10)])
			.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenUri, tokenId);

		const supplyfromContract: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContract.toNumber()).equal(tokenAmount);

		const amountToBurn = ethers.BigNumber.from(10);
		await expect(lc.connect(accs[3]).burn(signer.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.revertedWith("Need operator approval for 3rd party burns.")

		await expect(lc.setApprovalForAll(accs[3].address, true))
			.emit(lc, "ApprovalForAll")
			.withArgs(signer.address, accs[3].address, true);

		await expect(lc.connect(accs[3]).burn(signer.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.emit(lc, "TransferSingle")
			.withArgs(accs[3].address, signer.address, zeroAddress, ethers.BigNumber.from(0), amountToBurn)

		const supplyfromContractAfterBurn: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContractAfterBurn.toNumber()).equal(100 - amountToBurn.toNumber());

	});

	it("Should mint a new token and burn it, then check total supply", async function () {
		const tokenUri = "/tokenUri";
		const feeRecipient = accs[1];
		const tokenAmount = 100;
		const tokenId = 0;

		await expect(lc.mint(
			[{
				recipient: feeRecipient.address,
				value: ethers.BigNumber.from(10)
			}],
			ethers.BigNumber.from(tokenAmount),
			tokenUri,
			zeroAddress
		))
			.emit(lc, "SecondarySaleFees")
			.withArgs(0, [feeRecipient.address], [ethers.BigNumber.from(10)])
			.emit(lc, "URI")
			.withArgs(tokenBaseURI + tokenUri, tokenId);

		const supplyfromContract: BigNumber = await lc.tokenSupply(ethers.BigNumber.from(tokenId));
		expect(supplyfromContract.toNumber()).equal(tokenAmount);

		const amountToBurn = ethers.BigNumber.from(10);
		await expect(lc.connect(accs[3]).burn(signer.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.revertedWith("Need operator approval for 3rd party burns.")

		await expect(lc.setApprovalForAll(accs[3].address, true))
			.emit(lc, "ApprovalForAll")
			.withArgs(signer.address, accs[3].address, true);

		await expect(lc.connect(accs[3]).burn(signer.address, ethers.BigNumber.from(tokenId), amountToBurn))
			.emit(lc, "TransferSingle")
			.withArgs(accs[3].address, signer.address, zeroAddress, ethers.BigNumber.from(0), amountToBurn)


		let amountOfTokensLeftWithId = await lc.tokenSupply(tokenId);
		let totalSupply = await lc.totalSupply();

		expect(amountOfTokensLeftWithId.toNumber()).equal(90);
		expect(totalSupply.toNumber()).equal(1);


		await expect(lc.connect(accs[3]).burn(signer.address, ethers.BigNumber.from(tokenId), 90))
			.emit(lc, "TransferSingle")
			.withArgs(accs[3].address, signer.address, zeroAddress, ethers.BigNumber.from(0), 90)

		amountOfTokensLeftWithId = await lc.tokenSupply(tokenId);
		totalSupply = await lc.totalSupply();

		expect(amountOfTokensLeftWithId.toNumber()).equal(0);
		expect(totalSupply.toNumber()).equal(1);
	});

	it("Should verify that supportsInterface function works", async function () {
		const supportsGetRoyaltiesInterface = await lc.supportsInterface(getRoyaltiesInterfaceId);
		expect(supportsGetRoyaltiesInterface).equal(true);
		const supportsERC1155Interface = await lc.supportsInterface(ERC1155InterfaceId);
		expect(supportsERC1155Interface).equal(true);
	})
})