// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>
// Forked from EverDragons2(.com)'s code

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

//import "hardhat/console.sol";

contract SynCityCoupons is ERC721, ERC721Enumerable, Ownable {
  using Address for address;

  event SwapperSet(address swapper);

  string private _baseTokenURI = "https://blueprints.syn.city/meta/SYNCOUPON/";

  address public swapper;

  uint256 private _maxSupply;
  address public marketplace;

  modifier onlySwapper() {
    require(swapper != address(0) && _msgSender() == swapper, "forbidden");
    _;
  }

  constructor(uint256 maxSupply, address _marketplace) ERC721("Syn City Coupons", "SYNCOUPON") {
    // < starts from 1
    _maxSupply = maxSupply;
    require(_marketplace != address(0), "_marketplace cannot be 0x0");
    marketplace = _marketplace;
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

  // The swapper will manage the swap between the coupon and the final token
  function setSwapper(address swapper_) external onlyOwner {
    require(swapper_ != address(0), "swapper cannot be 0x0");
    swapper = swapper_;
  }

  function safeMint(uint256 quantity) external onlyOwner {
    uint nextId = balanceOf(marketplace) + 1;
    require(nextId + quantity - 1 <= _maxSupply, "not enough token to be minted");
    for (uint256 i = 0; i < quantity; i++) {
      _safeMint(marketplace, nextId++);
    }
  }

  // swapping, the coupon will be burned
  function burn(uint256 tokenId) public virtual onlySwapper {
    _burn(tokenId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseURI(string memory baseTokenURI) external onlyOwner {
    _baseTokenURI = baseTokenURI;
  }

  function contractURI() external view returns (string memory) {
    return _baseTokenURI;
  }
}
