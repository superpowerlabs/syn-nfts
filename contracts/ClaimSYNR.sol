pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ClaimSYNR is Ownable {
    mapping(uint32 => bool) public claimed;
    ERC721 synPass;
    ERC20 synr;
    bool public enabled;
    uint256 public award = 15000 * 10**18;

    constructor(address _synPass, address _synr) {
        synPass = ERC721(_synPass);
        synr = ERC20(_synr);
    }

    // Needs to transfer enough fund to contract before enabling.
    function enable() external onlyOwner {
        require(synr.balanceOf(address(this)) == award * 888, "Not enough SYNR");
        enabled = true;
    }

    function claim(uint32 passId) external {
        require(enabled, "Contract not enabled");
        require(passId <= 888, "Invalid pass id");
        require(!claimed[passId], "Already claimed");
        require(synPass.ownerOf(passId) == msg.sender, "Only onwer can claim");
        synr.transfer(msg.sender, award);
        claimed[passId] = true;
    }
}
