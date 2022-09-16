// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

import "./GetRoyalties.sol";

contract LiquidiftyCollectionERC1155 is
    Ownable,
    GetRoyalties,
    ERC1155,
    ERC1155URIStorage
{
    // bytes4(keccak256("mint(Fee[], uint256, string, address)")) =  0x7cb2d07b
    bytes4 private interfaceId;

    uint256 public totalSupply;
    string public name;
    string public symbol;
    string public contractURI;

    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public tokenSupply;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        string memory _tokenBaseURI
    ) ERC1155("") {
        name = _name;
        symbol = _symbol;
        contractURI = _contractURI;

        interfaceId = 0x7cb2d07b;
        _setBaseURI(_tokenBaseURI);
    }

    /**
     * @notice mints a token for a creator's address as owner of the token
     * @param _fees fees array
     * @param _supply initial token supply
     * @param _uri  token uri
     * @param _creator creator of a token. If address(0) is passed then msg.sender will be used as a token receiver
     */
    function mint(
        Fee[] memory _fees,
        uint256 _supply,
        string memory _uri,
        address _creator
    ) external {
        require(_supply != 0, "Supply should be positive");
        require(bytes(_uri).length > 0, "URI should be set");

        if (_creator == address(0x0)) {
            _creator = msg.sender;
        }

        _mint(_creator, totalSupply, _supply, "");
        _setURI(totalSupply, _uri);
        setFees(totalSupply, _fees);

        creators[totalSupply] = _creator;

        tokenSupply[totalSupply] = _supply;
        totalSupply++;
    }

    /**
     * @notice burns a token for an owner's address and reduces supply. Also, can be used by an operator on owner's behalf
     * @param _owner owner of a token or a
     * @param _id token id
     * @param _value amount of a token to burn
     */
    function burn(
        address _owner,
        uint256 _id,
        uint256 _value
    ) public {
        require(
            _owner == msg.sender || isApprovedForAll(_owner, msg.sender),
            "Need operator approval for 3rd party burns."
        );

        _burn(_owner, _id, _value);
        tokenSupply[_id] -= _value;
    }

    /**
     * @notice returns uri for token id with tokenPrefix concateneted
     * @dev _tokenId tokenId
     */
    function uri(uint256 _tokenId)
        public
        view
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return super.uri(_tokenId);
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
    function setTokenBaseURI(string memory _tokenBaseURI) public onlyOwner {
        _setBaseURI(_tokenBaseURI);
    }

    /**
     * @notice check for interface support
     * @dev Implementation of the {IERC165} interface.
     */
    function supportsInterface(bytes4 _interfaceId)
        public
        view
        virtual
        override(GetRoyalties, ERC1155)
        returns (bool)
    {
        return
            interfaceId == _interfaceId ||
            GetRoyalties.supportsInterface(_interfaceId) ||
            ERC1155.supportsInterface(_interfaceId);
    }
}
