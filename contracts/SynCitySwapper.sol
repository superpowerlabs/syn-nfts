// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>
// Forked from EverDragons2(.com)'s code

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

interface ISynToken {
  function safeMint(address to, uint256 quantity) external;

  function balanceOf(address owner) external view returns (uint256);

  function burn(uint256 tokenId) external;

  function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
}

// To work properly the swapper must be authorized in SynCityCoupons
// calling .setSwapper() and in SynCityBlueprints calling .setMinter()
contract SynCitySwapper is Ownable {
  using ECDSA for bytes32;
  using SafeMath for uint256;

  event ValidatorSet(address validator);

  address public validator;
  ISynToken private _blueprint;
  ISynToken private _coupon;
  mapping(uint256 => bool) private _minted;

  function setValidator(address validator_) public onlyOwner {
    require(validator_ != address(0), "validator cannot be 0x0");
    validator = validator_;
  }

  constructor(
    address blueprint,
    address coupon,
    address validator_
  ) {
    require(blueprint != address(0), "address cannot be 0x0");
    require(coupon != address(0), "address cannot be 0x0");
    require(validator_ != address(0), "address cannot be 0x0");
    _blueprint = ISynToken(blueprint);
    _coupon = ISynToken(coupon);
    setValidator(validator_);
  }

  function claimTokenFromPass(uint256 tokenId, bytes memory signature) public {
    require(isSignedByValidator(encodeForSignature(_msgSender(), tokenId), signature), "invalid signature");
    require(tokenId <= 777, "tokenId out of range");
    require(!_minted[tokenId], "this pass has been already used");
    _minted[tokenId] = true;
    _blueprint.safeMint(_msgSender(), 1);
  }

  function swapTokenFromCoupon() external onlyOwner {
    uint256 balance = _coupon.balanceOf(_msgSender());
    for (uint256 i = 0; i < balance; i++) {
      uint256 tokenId = _coupon.tokenOfOwnerByIndex(_msgSender(), i);
      require(tokenId <= 7000, "tokenId out of range");
      require(!_minted[tokenId.add(777)], "this coupon has been already used");
      _minted[tokenId.add(777)] = true;
      _blueprint.safeMint(_msgSender(), 1);
      _coupon.burn(tokenId);
    }
  }

  // cryptography

  function isSignedByValidator(bytes32 _hash, bytes memory _signature) public view returns (bool) {
    return validator == ECDSA.recover(_hash, _signature);
  }

  function encodeForSignature(address recipient, uint256 tokenId) public pure returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          recipient,
          tokenId
        )
      );
  }
}
