// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// @dev After deploying the contract, transfer 888 * 15000 * 10**18 SYNR
// to the contract (do not use safeTransfer) and call enable.

//import "hardhat/console.sol";

contract ClaimSYNR is Ownable {
    mapping(uint32 => bool) public claimed;
    ERC721 public synPass;
    ERC20 public synr;
    uint256 public award = 15000 * 10**18;
    uint256 public startBlock;
    bool public active;

    constructor(address _synPass, address _synr) {
        synPass = ERC721(_synPass);
        synr = ERC20(_synr);
    }

    // Needs to transfer enough fund to contract before enabling.
    function enable(uint256 _startBlock) external onlyOwner {
        require(!active, "Claiming already started");
        require(synr.balanceOf(address(this)) == award * 888, "Not enough SYNR");
        require(_startBlock >= block.number, "Needs to be in the future");
        startBlock = _startBlock;
    }

    function claim(uint32 passId) external {
        _claim(passId);
    }

    function claimMany(uint32[] memory passIds) external {
        for (uint i = 0; i< passIds.length; i++) {
            _claim(passIds[i]);
        }
    }

    function _claim(uint32 passId) internal {
        require(enabled(), "Contract not enabled");
        require(passId <= 888, "Invalid pass id");
        require(!claimed[passId], "Already claimed");
        require(synPass.ownerOf(uint256(passId)) == msg.sender, "Only owner can claim");
        synr.transfer(msg.sender, award);
        claimed[passId] = true;
        if (!active) {
            active = true;
        }
    }

    function enabled() public view returns(bool) {
        return startBlock != 0 && block.number >= startBlock;
    }
}
