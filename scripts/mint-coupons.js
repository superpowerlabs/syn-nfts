// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const {assert} = require("chai")
const hre = require("hardhat");
const fs = require('fs-extra')
const path = require('path')
const requireOrMock = require('require-or-mock')
const ethers = hre.ethers

const deployed = requireOrMock('export/deployed.json')

async function currentChainId() {
  return (await ethers.provider.getNetwork()).chainId
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const chainId = await currentChainId()
  const [deployer] = await ethers.getSigners()

  if (!deployed[chainId].SynCityCoupons) {
    console.error('It looks like SynCityCoupons has not been deployed on this network')
    process.exit(1)
  }

  const couponABI = require('../artifacts/contracts/SynCityCoupons.sol/SynCityCoupons.json').abi
  const couponNft = new ethers.Contract(deployed[chainId].SynCityCoupons, couponABI, deployer)

  const batch = 40
  let quantity = batch
  while (true) {
    const balance = (await couponNft.balanceOf(process.env.BINANCE_ADDRESS)).toNumber()
    console.log('Current balance:', balance)
    if (balance === 7000) {
      console.log('Minting copleted')
    } else {
      if (balance + quantity > 7000) {
        quantity = 7000 - balance
      }
      console.log('Minting new batch of', quantity, '...')
      await couponNft.safeMint(quantity, {
        gasLimit: 5e6
      })
      console.log('Minted', quantity, 'tokens')
    }
    await new Promise(resolve => setTimeout(resolve, 10000))
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

