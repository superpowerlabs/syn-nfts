// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>
// Forked from EverDragons2(.com)'s code

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//import "hardhat/console.sol";

contract PreSaleCoupons is ERC721, ERC721Enumerable, Ownable {
  using Address for address;
  using Counters for Counters.Counter;

  event SwapperSet(address swapper);

  string private _baseTokenURI = "https://blueprints.syn.city/meta/sync/";

  address public swapper;
  Counters.Counter private _tokenIdTracker;

  uint256 private _totalSupply;

  modifier onlySwapper() {
    require(swapper != address(0) && _msgSender() == swapper, "forbidden");
    _;
  }

  constructor(uint256 totalSupply) ERC721("Syn City Coupons", "SYNC") {
    _tokenIdTracker.increment();
    // < starts from 1
    _totalSupply = totalSupply;
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

  function safeMint(address to, uint256 quantity) external onlyOwner {
    require(to != address(0), "recipient cannot be 0x0");
    require(_tokenIdTracker.current() + quantity - 1 <= _totalSupply, "not enough token to be minted");
    for (uint256 i = 0; i < quantity; i++) {
      _safeMint(to, _tokenIdTracker.current());
      _tokenIdTracker.increment();
    }
  }

  // swapping, the coupon will be burned
  function burn(uint256 tokenId) public virtual onlySwapper {
    _burn(tokenId);
  }

  function nextTokenId() external view returns (uint256) {
    return _tokenIdTracker.current();
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseURI(string memory baseTokenURI) external onlyOwner {
    _baseTokenURI = baseTokenURI;
  }
}
