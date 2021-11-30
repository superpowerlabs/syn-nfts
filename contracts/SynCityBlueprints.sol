// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@superpower.io>
// Superpower Labs / Syn City

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//import "hardhat/console.sol";

contract SynCityBlueprints is ERC721, ERC721Enumerable, Ownable {
  using Address for address;
  using Counters for Counters.Counter;

  event FactorySet(address factory);
  event ConfInitialized(address minter, uint16 minCap);
  event BaseURIUpdated(string baseTokenURI);
  event MintingEnded();

  struct Conf {
    address minter;
    bool mintingEnded;
    uint16 minCap;
  }

  Conf private _conf;

  Counters.Counter private _tokenIdTracker;
  string private _baseTokenURI = "https://nft.syn.city/meta/SYNB";

  modifier onlyMinter() {
    require(_conf.minter != address(0) && _conf.minter == _msgSender(), "forbidden");
    _;
  }

  constructor() ERC721("Syn City Genesis Blueprints", "SYNB") {
    _tokenIdTracker.increment();
    // < starts from 1
  }

  function initConf(address minter, uint16 minCap) external onlyOwner {
    require(minter != address(0), "minter cannot be null");
    // minCap = 0, means that the collection cannot be capped
    _conf = Conf({minter: minter, mintingEnded: false, minCap: minCap});
    emit ConfInitialized(minter, minCap);
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

  // Initially, the minting is done by the factory
  // Later, it will be done by the game's contract
  function safeMint(address to, uint256 quantity) external onlyMinter {
    require(to != address(0), "recipient cannot be 0x0");
    require(!_conf.mintingEnded, "minting ended");
    for (uint256 i = 0; i < quantity; i++) {
      uint256 tokenId = _tokenIdTracker.current();
      _tokenIdTracker.increment();
      _safeMint(to, tokenId);
    }
  }

  function burn(uint256 tokenId) external virtual onlyMinter {
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
    emit BaseURIUpdated(baseTokenURI);
  }

  function contractURI() external view returns (string memory) {
    return _baseURI();
  }

  function endMinting() external onlyOwner {
    // needed if we decide to cap the collection and
    // create new collections for future items.
    // TODO: decide if forcing the cap, leaving some coupon unswapped or not
    require(_conf.minCap > 0 && _tokenIdTracker.current() >= _conf.minCap, "redeemable tokens still available");
    _conf.mintingEnded = true;
    emit MintingEnded();
  }
}
