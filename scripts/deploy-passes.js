// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
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
  const [deployer] = await ethers.getSigners()

  console.log(
      "Deploying contracts with the account:",
      deployer.address
  );

  console.log('Current chain ID', await currentChainId())

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const baseTokenURI = chainId === 1337
      ? "http://localhost:7777/meta/SYNPASS/"
      : "https://blueprints.syn.city/meta/SYNPASS/"

  const SynCityPasses = await ethers.getContractFactory("SynCityPasses")
  const nft = await SynCityPasses.deploy(baseTokenURI)
  await nft.deployed()
  const validator = chainId === 1337
      ? '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' // hardhat #4
      : process.env.VALIDATOR

  const operator = chainId === 1337
      ? '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' // hardhat #2
      : process.env.OPERATOR

  console.log(validator)

  await nft.setValidatorAndOperator(validator, operator)

  const addresses = {
    SynCityPasses: nft.address
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

  const tmpDir = path.resolve(__dirname, '../tmp/SynCityPasses')
  await fs.ensureDir(tmpDir)
  await fs.writeFile(path.join(tmpDir, chainId.toString()), addresses.SynCityPasses)

  // exports ABIs

  const ABIs = {
    when: (new Date).toISOString(),
    contracts: {}
  }

  const contractsDir = await fs.readdir(path.resolve(__dirname, '../artifacts/contracts'))

  for (let name of contractsDir) {
    name = name.split('.')[0]
    let source = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
    let json = require(source)
    ABIs.contracts[name] = json.abi
  }
  await fs.writeFile(path.resolve(__dirname, '../export/ABIs.json'), JSON.stringify(ABIs, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

