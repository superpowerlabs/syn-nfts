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
const requireOrMock = require('require-or-mock');
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
  const isLocalNode = /1337$/.test(chainId)
  const [deployer] = await ethers.getSigners()

  console.log(
      "Deploying contracts with the account:",
      deployer.address
  );

  const network = chainId === 97 ? 'bsc_testnet'
          : 'localhost'


  console.log('Current chain ID', await currentChainId())

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SynCityCoupons = await ethers.getContractFactory("SynCityCouponsSimplified")
  const nft = await SynCityCoupons.deploy(8000)
  await nft.deployed()

  // await nft.setMarketplace(process.env.BINANCE_ADDRESS)

  const addresses = {
    SynCityCouponsSimplified: nft.address
  }

  if (!deployed[chainId]) {
    deployed[chainId] = {}
  }
  deployed[chainId] = Object.assign(deployed[chainId], addresses)

  console.log(deployed)

  console.log(`
To verify SynCityCouponsSimplified source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${nft.address}  \\
      8000
`)

  const deployedJson = path.resolve(__dirname, '../export/deployed.json')
  await fs.ensureDir(path.dirname(deployedJson))
  await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

