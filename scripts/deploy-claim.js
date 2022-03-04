// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const {assert, expect} = require("chai")
const hre = require("hardhat");
const fs = require('fs-extra')
const path = require('path')
const requireOrMock = require('require-or-mock')
const {signPackedData, getBlockNumberInTheFuture} = require('../test/helpers');
const net = require('net');
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
  const [deployer, holder1, holder2, holder3, validator, holder4, holder5, holder6] = await ethers.getSigners()

  if (!deployed[chainId]) {
    deployed[chainId] = {}
  }

  if (!deployed[chainId].SynCityPasses) {
    console.error('It looks like SynCityPasses has not been deployed on this network')
    process.exit(1)
  }

  const network = chainId === 1 ? 'ethereum'
      : chainId === 42 ? 'kovan'
          : 'localhost'

  const SynCityPasses = await ethers.getContractFactory("SynCityPasses")
  const passes = SynCityPasses.attach(deployed[chainId].SynCityPasses)

  console.log("Deploying contracts with the account:", deployer.address)
  console.log('Current chain ID', await currentChainId())
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ClaimSYNR = await ethers.getContractFactory("ClaimSYNR")
  const SynrMock = await ethers.getContractFactory("SynrMock")

  const SYNR = await SynrMock.deploy()
  await SYNR.deployed()
  const claim = await ClaimSYNR.deploy(passes.address, SYNR.address)
  await claim.deployed()

  const addresses = {
    ClaimSYNR: claim.address,
    SynrMock: SYNR.address
  }

  deployed[chainId] = Object.assign(deployed[chainId], addresses)

  console.log(deployed)

  const deployedJson = path.resolve(__dirname, '../export/deployed.json')
  await fs.ensureDir(path.dirname(deployedJson))
  await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))

  async function claimAPass(holder) {
    let authCode = ethers.utils.id('a' + Math.random())
    let hash = await passes.encodeForSignature(holder.address, authCode, 0)
    let signature = await signPackedData(hash)
    await (await passes.connect(holder).claimFreeToken(authCode, 0, signature)).wait()
  }

  console.log(`
To verify the SYNR Mock source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${SYNR.address} \\

To verify ClaimSYNR source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${claim.address} \\
      ${passes.address} \\
      ${SYNR.address}
      
`)

  if (isLocalNode || network === 'kovan') {

    let totalAmount = ethers.BigNumber.from(15000 + '0'.repeat(18)).mul(888)
    await SYNR.mint(claim.address, totalAmount)
    const blockNumber = (await this.ethers.provider.getBlock()).number
    await claim.enable(blockNumber + 2)

    if (isLocalNode) {
      try {
        await claimAPass(holder1)
        await claimAPass(holder2)
        await claimAPass(holder3)
        await claimAPass(holder4)
        const nextTokenId = await passes.nextTokenId()
        await passes.connect(holder4).transferFrom(holder4.address, holder2.address, nextTokenId - 1)
        await claimAPass(holder5)
        await passes.connect(holder5).transferFrom(holder5.address, holder2.address, nextTokenId)
        await claimAPass(holder6)

      } catch (e) {
        console.log(e)
        // tokens already minted
      }
    }

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

