// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Author: Francesco Sullo <francesco@superpower.io>
// Superpower Labs / Syn City
// Cryptography forked from Everdragons2(.com)'s code


import "../SynCityPasses.sol";

//import "hardhat/console.sol";

contract SynCityPassesMock is SynCityPasses {


  constructor(address _validator) SynCityPasses(_validator) {
    _remaining[0] = 2;
    _remaining[1] = 2;
    _remaining[2] = 2;
    maxTokenId = 14;
  }

}
