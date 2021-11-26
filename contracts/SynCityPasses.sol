// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>
// Forked from EverDragons2(.com)'s code

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

//import "hardhat/console.sol";

contract SynCityPasses is ERC721, ERC721Enumerable, Ownable {
  using Address for address;
  using ECDSA for bytes32;

  event ValidatorSet(address validator);
  event OperatorSet(address operator);
  event BaseURIUpdated();

  uint256 public nextTokenId = 1;
  uint256 public maxTokenId;
  mapping(uint256 => uint256) public remaining;

  string private _baseTokenURI = "https://nft.syn.city/meta/SYNP/";
  bool public tokenURIHasBeenFrozen;

  using ECDSA for bytes32;
  using SafeMath for uint256;

  address public validator;
  address public operator;
  mapping(bytes32 => bool) public usedCodes;

  modifier onlyOperator() {
    require(operator != address(0) && _msgSender() == operator, "forbidden");
    _;
  }

  address[] public team = [
    0x16244cdFb0D364ac5c4B42Aa530497AA762E7bb3 // Devansh
  ];

  constructor(
    uint256 _maxTokenId,
    address _validator,
    address _operator
  ) ERC721("Syn City Passes", "SYNP") {
    maxTokenId = _maxTokenId;
    setValidator(_validator);
    setOperator(_operator);
    for (uint256 i = 0; i < team.length; i++) {
      _safeMint(team[i], nextTokenId++);
    }
  }

  function getRemaining(uint256 typeIndex) external view returns (uint256) {
    return remaining[typeIndex];
  }

  function setValidator(address validator_) public onlyOwner {
    require(validator_ != address(0), "validator cannot be 0x0");
    validator = validator_;
    emit ValidatorSet(validator);
  }

  function setOperator(address operator_) public onlyOwner {
    require(operator_ != address(0), "operator cannot be 0x0");
    operator = operator_;
    emit OperatorSet(operator);
  }

  function setSeason(uint256 typeIndex, uint256 supply) external onlyOperator {
    require(remaining[typeIndex] == 0, "season already set");
    // the 1 will avoid resetting a season
    remaining[typeIndex] = supply + 1;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseTokenURI(string memory uri) external onlyOwner {
    require(!tokenURIHasBeenFrozen, "token uri has been frozen");
    _baseTokenURI = uri;
    emit BaseURIUpdated();
  }

  function freezeBaseTokenURI() external onlyOwner {
    tokenURIHasBeenFrozen = true;
  }

  function contractURI() external view returns (string memory) {
    return _baseTokenURI;
  }

  function claimFreeToken(
    bytes32 authCode,
    uint256 typeIndex,
    bytes memory signature
  ) external {
    _mintToken(_msgSender(), authCode, typeIndex, signature);
  }

  function giveawayToken(
    address to,
    bytes32 authCode,
    uint256 typeIndex,
    bytes memory signature
  ) external onlyOperator {
    _mintToken(to, authCode, typeIndex, signature);
  }

  function _mintToken(
    address to,
    bytes32 authCode,
    uint256 typeIndex,
    bytes memory signature
  ) internal {
    require(to != address(0), "invalid sender");
    require(balanceOf(to) == 0, "one pass per wallet");
    require(!usedCodes[authCode], "authCode already used");
    require(remaining[typeIndex] > 1, "no more tokens in this category");
    require(isSignedByValidator(encodeForSignature(to, authCode, typeIndex), signature), "invalid signature");
    require(nextTokenId <= maxTokenId, "distribution ended");
    _safeMint(to, nextTokenId++);
    remaining[typeIndex]--;
    usedCodes[authCode] = true;
  }

  function isSignedByValidator(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    return validator != address(0) && validator == _hash.recover(_signature);
  }

  function encodeForSignature(
    address to,
    bytes32 authCode,
    uint256 typeIndex
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          to,
          authCode,
          typeIndex
        )
      );
  }
}
