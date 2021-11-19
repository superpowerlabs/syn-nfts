// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

//import "hardhat/console.sol";

contract SynCityPasses is ERC721, ERC721Enumerable, Ownable {
  using Address for address;
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdTracker;

  struct Conf {
    uint16 maxTokenId;
    uint16[3] remaining;
  }

  Conf private _conf;

  string private _baseTokenURI = "https://blueprints.syn.city/meta/SYNPASS/";
  bool private _baseTokenURIFrozen;

  using ECDSA for bytes32;
  using SafeMath for uint256;

  event ValidatorSet(address validator);

  address public validator;
  address public operator = 0x16244cdFb0D364ac5c4B42Aa530497AA762E7bb3;
  mapping(bytes32 => bool) public usedCodes;

  constructor() ERC721("Syn City Passes", "SYNPASS") {
    _tokenIdTracker.increment(); // < starts from 1
    uint16[3] memory remaining = [
      750, // alternate reality game solutions
      8, // team treasury
      19 // community events
    ];
    Conf({maxTokenId: 777, remaining: remaining});
  }

  function setValidator(address validator_) public onlyOwner {
    require(validator_ != address(0), "validator cannot be 0x0");
    validator = validator_;
    emit ValidatorSet(validator);
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

  function _mintToken(address to) internal {
    require(_tokenIdTracker.current() <= _conf.maxTokenId, "distribution ended");
    require(to != address(0), "invalid sender");
    require(balanceOf(to) == 0, "one blueprint per wallet");
    _safeMint(to, _tokenIdTracker.current());
    _tokenIdTracker.increment();
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseTokenURI(string memory uri) external onlyOwner {
    require(!_baseTokenURIFrozen, "token uri has been frozen");
    _baseTokenURI = uri;
  }

  function freezeBaseTokenURI() external onlyOwner {
    _baseTokenURIFrozen = true;
  }

  function claimFreeToken(
    bytes32 authCode,
    uint256 typeIndex,
    bytes memory signature
  ) external {
    require(!usedCodes[authCode], "authCode already used");
    require(_conf.remaining[typeIndex] > 0, "no more tokens in this category");
    require(isSignedByValidator(encodeForSignature(_msgSender(), typeIndex, authCode), signature), "invalid signature");
    _mintToken(_msgSender());
    _conf.remaining[typeIndex]--;
    usedCodes[authCode] = true;
  }

  function giveawayTokens(address[] memory recipients) external onlyOwner {
    for (uint256 i = 0; i < recipients.length; i++) {
      _mintToken(recipients[i]);
    }
  }

  function isSignedByValidator(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    return validator == ECDSA.recover(_hash, _signature);
  }

  function encodeForSignature(
    address recipient,
    uint256 typeIndex,
    bytes32 authCode
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          recipient,
          typeIndex,
          authCode
        )
      );
  }
}
