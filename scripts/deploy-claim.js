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
const {signPackedData, getBlockNumber} = require('../test/helpers');
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
  const [deployer, holder1, holder2, holder3, validator, holder4] = await ethers.getSigners()

  if (!deployed[chainId]) {
    deployed[chainId] = {}
  }

  if (!deployed[chainId].SynCityPasses) {
    console.error('It looks like SynCityPasses has not been deployed on this network')
    process.exit(1)
  }

  async function getBlockNumberInTheFuture() {
    return (await getBlockNumber()) + 1
  }

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

  let totalAmount = ethers.BigNumber.from(15000 + '0'.repeat(18)).mul(888)
  await SYNR.mint(claim.address, totalAmount)
  console.log(await claim.enabled())
  await claim.enable(await getBlockNumberInTheFuture())
  console.log(await claim.enabled())


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
    await passes.connect(holder).claimFreeToken(authCode, 0, signature)
  }


  if (isLocalNode) {

    await claimAPass(holder1)
    await claimAPass(holder2)
    await claimAPass(holder3)

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

