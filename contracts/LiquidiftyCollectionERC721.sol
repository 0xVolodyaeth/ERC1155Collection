// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GetRoyalties.sol";

contract LiqudiftyCollectionERC721 is Ownable, GetRoyalties, ERC721URIStorage {
    // bytes4(keccak256("mint(Fee[], string, address)")) = 0xa0998e76
    bytes4 private interfaceId;

    uint256 public totalSupply;
    string public contractURI;
    string public tokenBaseURI;
    mapping(uint256 => address) public creators;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        string memory _tokenBaseURI
    ) ERC721(_name, _symbol) {
        contractURI = _contractURI;
        tokenBaseURI = _tokenBaseURI;

        interfaceId = 0xa0998e76;
    }

    /**
     * @notice mints a token for a creator's address as owner of the token
     * @param _fees fees array
     * @param _uri  token uri
     * @param _creator creator of a token. If address(0) is passed then msg.sender will be used as a token receiver
     */
    function mint(
        Fee[] memory _fees,
        string memory _uri,
        address _creator
    ) public {
        require(bytes(_uri).length > 0, "URI should be set");
        if (_creator == address(0x0)) {
            _creator = msg.sender;
        }

        _mint(_creator, totalSupply);
        _setTokenURI(totalSupply, _uri);
        setFees(totalSupply, _fees);

        creators[totalSupply] = _creator;
        totalSupply++;
    }

    /**
     * @notice burns a token for an owner's address and reduces supply. Also, can be used by an operator on owner's behalf
     * @param _owner owner of a token or a
     * @param _id token id
     */
    function burn(address _owner, uint256 _id) external {
        require(
            _owner == msg.sender || isApprovedForAll(_owner, msg.sender),
            "Need operator approval for 3rd party burns."
        );
        super._burn(_id);
    }

    /**
     * @notice sets new contractURI
     * @param _contractURI new contractURI
     */
    function setContractURI(string memory _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    /**
     * @notice sets new tokenBaseURI
     * @param _tokenBaseURI new tokenBaseURI
     */
    function setTokenBaseURI(string memory _tokenBaseURI) external onlyOwner {
        tokenBaseURI = _tokenBaseURI;
    }

    function _baseURI() internal view override(ERC721) returns (string memory) {
        return tokenBaseURI;
    }

    function supportsInterface(bytes4 _interfaceId)
        public
        view
        virtual
        override(GetRoyalties, ERC721)
        returns (bool)
    {
        return
            interfaceId == _interfaceId ||
            GetRoyalties.supportsInterface(_interfaceId) ||
            ERC721.supportsInterface(_interfaceId);
    }
}
