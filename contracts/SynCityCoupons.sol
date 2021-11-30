// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@superpower.io>
// Superpower Labs / Syn City

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SynCityCoupons is ERC721, ERC721Enumerable, Ownable {
  using Address for address;

  event SwapperSet(address swapper);
  event DepositAddressSet(address depositAddress);
  event BaseTokenURIUpdated(string baseTokenURI);

  string private _baseTokenURI = "https://nft.syn.city/meta/SYNBC/";

  address public swapper;
  bool public mintEnded;
  bool public transferEnded;

  uint256 public maxSupply;
  address public depositAddress;

  modifier onlySwapper() {
    require(swapper != address(0) && _msgSender() == swapper, "forbidden");
    _;
  }

  constructor(uint256 maxSupply_) ERC721("Syn City Blueprint Coupons", "SYNBC") {
    maxSupply = maxSupply_;
  }

  function setDepositAddress(address _depositAddress) external onlyOwner {
    require(_depositAddress != address(0), "_depositAddress cannot be 0x0");
    depositAddress = _depositAddress;
    emit DepositAddressSet(_depositAddress);
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

  // The swapper will manage the swap between the coupon and the final token
  function setSwapper(address swapper_) external onlyOwner {
    require(swapper_ != address(0), "swapper cannot be 0x0");
    swapper = swapper_;
    emit SwapperSet(swapper);
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
    uint256 tokenId = balanceOf(owner());
    require(tokenId - quantity >= 0, "not enough token to be transferred");
    for (uint256 i = 0; i < quantity; i++) {
      safeTransferFrom(owner(), depositAddress, tokenId--, "");
    }
    if (tokenId == 0) {
      transferEnded = true;
    }
  }

  // swapping, the coupon will be burned
  function burn(uint256 tokenId) external virtual onlySwapper {
    _burn(tokenId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseURI(string memory baseTokenURI) external onlyOwner {
    _baseTokenURI = baseTokenURI;
    emit BaseTokenURIUpdated(baseTokenURI);
  }
}
