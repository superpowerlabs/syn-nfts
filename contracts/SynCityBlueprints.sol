// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@superpower.io>
// Superpower Labs / Syn City

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./SynCityCoupons.sol";

import "hardhat/console.sol";

contract SynCityBlueprints is ERC721, ERC721Enumerable, Ownable {
  //  using Address for address;
  using ECDSA for bytes32;

  event GameSetOrUpdated(address game);
  event ValidatorUpdated(address validator);

  SynCityCoupons public coupons;

  address public validator;
  address public game;

  constructor(address coupons_, address validator_) ERC721("Syn City Genesis Blueprints", "SYNB") {
    coupons = SynCityCoupons(coupons_);
    validator = validator_;
  }

  function setGame(address game_) external onlyOwner {
    require(game_ != address(0), "game cannot be 0x0");
    game = game_;
    emit GameSetOrUpdated(game_);
  }

  function updateValidator(address validator_) external onlyOwner {
    require(validator_ != address(0), "game cannot be 0x0");
    validator = validator_;
    emit ValidatorUpdated(validator_);
  }

  // implementation required by the compiler, extending ERC721 and ERC721Enumerable
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  // implementation required by the compiler, extending ERC721 and ERC721Enumerable
  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function burn(uint256 tokenId) external virtual {
    require(game != address(0) && _msgSender() == game, "only the game can burn to level up");
    _burn(tokenId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return "https://data.syn.city/blueprints/";
  }

  function claimTokenFromPass(uint256[] memory tokenIds, bytes memory signature) public {
    require(isSignedByValidator(encodeForSignature(_msgSender(), tokenIds), signature), "invalid signature");
    for (uint i = 0; i < tokenIds.length; i++) {
      require(tokenIds[i] <= 888, "tokenId out of range");
      uint tokenId = tokenIds[i] + 8000;
      _safeMint(_msgSender(), tokenId);
    }
  }

  function swapTokenFromCoupon(uint256 limit) external {
    uint256 balance = coupons.balanceOf(_msgSender());
    require(balance > 0, "no tokens here");
    if (limit == 0 || limit > balance) {
      // split the process in many steps to not go out of gas
      limit = balance;
    }
    for (uint256 i = balance; i > balance - limit; i--) {
      uint256 tokenId = coupons.tokenOfOwnerByIndex(_msgSender(), i - 1);
      require(tokenId <= 8000, "tokenId out of range");
      _safeMint(_msgSender(), tokenId);
      coupons.burn(tokenId);
    }
  }

  // called internally, and externally from the web3 app
  function isSignedByValidator(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    return validator == _hash.recover(_signature);
  }

  // called internally, and externally from the web3 app
  function encodeForSignature(address recipient, uint256[] memory tokenIds) public view returns (bytes32) {
    return
    keccak256(
      abi.encodePacked(
        "\x19\x01", // EIP-191
        _getChainId(),
        recipient,
        tokenIds
      )
    );
  }

  function _getChainId() internal view returns (uint256) {
    uint256 id;
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      id := chainid()
    }
    return id;
  }
}
