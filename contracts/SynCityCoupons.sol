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

  string private _baseTokenURI = "https://nft.syn.city/meta/SYNBC/";

  address public swapper;
  bool public mintEnded;
  bool public transferEnded;

  uint256 public maxSupply;
  address public marketplace;

  modifier onlySwapper() {
    require(swapper != address(0) && _msgSender() == swapper, "forbidden");
    _;
  }

  constructor(uint256 maxSupply_) ERC721("Syn City Blueprint Coupons", "SYNBC") {
    // < starts from 1
    maxSupply = maxSupply_;
  }

  function setMarketplace(address _marketplace) external {
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

  function selfSafeMint(uint256 quantity) external onlyOwner {
    require(!mintEnded, "minting ended");
    uint256 nextId = balanceOf(owner()) + 1;
    require(nextId + quantity - 1 <= maxSupply, "not enough token to be minted");
    for (uint256 i = 0; i < quantity; i++) {
      _safeMint(owner(), nextId++);
    }
    if (nextId > maxSupply) {
      mintEnded = true;
    }
  }

  function batchTransfer(uint256 quantity) external onlyOwner {
    require(mintEnded, "minting not ended yet");
    require(!transferEnded, "batch transfer ended");
    require(balanceOf(owner()) - quantity >= 0, "not enough token to be transferred");
    for (uint256 i = 0; i < quantity; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(owner(), 0);
      safeTransferFrom(owner(), marketplace, tokenId, "");
    }
    if (balanceOf(marketplace) == maxSupply) {
      transferEnded = true;
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
