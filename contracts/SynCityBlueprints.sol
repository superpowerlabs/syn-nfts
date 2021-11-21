// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@sullo.co>
// Forked from EverDragons2(.com)'s code

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//import "hardhat/console.sol";

contract SynCityBlueprints is ERC721, ERC721Enumerable, Ownable {
  using Address for address;
  using Counters for Counters.Counter;

  event FactorySet(address factory);

  struct Conf {
    address minter;
    bool mintingEnded;
    uint16 minCap;
  }

  Conf private _conf;

  Counters.Counter private _tokenIdTracker;
  string private _baseTokenURIPrefix = "https://blueprints.syn.city/meta/";

  modifier onlyMinter() {
    require(_conf.minter != address(0) && _conf.minter == _msgSender(), "forbidden");
    _;
  }

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    _tokenIdTracker.increment(); // < starts from 1
  }

  function initConf(address minter, uint16 minCap) external onlyOwner {
    require(minter != address(0), "minter cannot be null");
    // minCap = 0, means that the collection cannot be capped
    _conf = Conf({minter: minter, mintingEnded: false, minCap: minCap});
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

  // Initially, the minting is done by the factory
  // Later, it will be done by the game's contract
  function safeMint(address to, uint256 quantity) external onlyMinter {
    require(to != address(0), "recipient cannot be 0x0");
    require(!_conf.mintingEnded, "minting ended");
    for (uint256 i = 0; i < quantity; i++) {
      _safeMint(to, _tokenIdTracker.current());
      _tokenIdTracker.increment();
    }
  }

  function burn(uint256 tokenId) public virtual onlyMinter {
    _burn(tokenId);
  }

  function nextTokenId() external view returns (uint256) {
    return _tokenIdTracker.current();
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return string(abi.encodePacked(_baseTokenURIPrefix, symbol(), "/"));
  }

  function updateBaseTokenURIPrefix(string memory baseTokenURIPrefix) external onlyOwner {
    _baseTokenURIPrefix = baseTokenURIPrefix;
  }

  function contractURI() external view returns (string memory) {
    return _baseTokenURI;
  }

  function endMinting() external onlyOwner {
    // needed if we decide to cap the collection and
    // create new collections for future items
    require(_conf.minCap > 0 && _tokenIdTracker.current() >= _conf.minCap, "redeemable tokens still available");
    _conf.mintingEnded = true;
  }
}
