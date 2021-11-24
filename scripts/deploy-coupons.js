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
const ethers = hre.ethers

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
  const isLocalNode = /1337$/.test(chainId)
  const [deployer] = await ethers.getSigners()

  console.log(
      "Deploying contracts with the account:",
      deployer.address
  );

  console.log('Current chain ID', await currentChainId())

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const baseTokenURI = isLocalNode
      ? "http://localhost:6660/meta/SYNCOUPON/"
      : "https://nft.syn.city/meta/SYNCOUPON/"

  const SynCityCoupons = await ethers.getContractFactory("SynCityCoupons")
  const nft = await SynCityCoupons.deploy(7000)
  await nft.deployed()

  // await nft.setValidatorAndOperator(validator, operator)

  const addresses = {
    SynCityCoupons: nft.address
  }

  let result = {}
  const deployed = path.resolve(__dirname, '../export/deployed.json')
  if (fs.existsSync(deployed)) {
    result = require('../export/deployed.json')
  }
  if (!result[chainId]) {
    result[chainId] = {}
  }
  result[chainId] = Object.assign(result[chainId], addresses)

  console.log(result)

  await fs.ensureDir(path.dirname(deployed))
  await fs.writeFile(deployed, JSON.stringify(result, null, 2))

  const tmpDir = path.resolve(__dirname, '../tmp/SynCityCoupons')
  await fs.ensureDir(tmpDir)
  await fs.writeFile(path.join(tmpDir, chainId.toString()), addresses.SynCityCoupons)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

