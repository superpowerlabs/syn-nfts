// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
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

  const [deployer] = await ethers.getSigners();

  console.log(
      "Deploying contracts with the account:",
      deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SynCityPasses = await ethers.getContractFactory("SynCityPasses")
  const synPasses = await SynCityPasses.deploy()
  await synPasses.deployed()
  const SynCityPassesFactory = await ethers.getContractFactory("SynCityPassesFactory")
  const synNFTFactory = await SynCityPassesFactory.deploy()
  await synNFTFactory.deployed()
  await synPasses.setValidator(process.env.VALIDATOR)


  const addresses = {
    SynCityPasses: synPasses.address,
    SynCityPassesFactory: synNFTFactory.address,
  }

  let result  = {}
  const deployed = path.resolve(__dirname, '../export/deployed.json')
  if (fs.existsSync(deployed)) {
    result = require('../export/deployed.json')
  }

  result[await currentChainId()] = addresses

  console.log(result)

  await saveAddresses(result, addresses)

}

async function saveAddresses(result, addresses) {
  let output = path.resolve(__dirname, '../export/deployed.json')
  await fs.ensureDir(path.dirname(output))
  await fs.writeFile(output, JSON.stringify(result, null, 2))
  await fs.ensureDir(path.resolve(__dirname, '../tmp'))

  // for immediate verification
  console.log(path.resolve(__dirname, '../tmp/SynCityPassesAddress'), addresses.SynCityPasses)
  await fs.writeFile(path.resolve(__dirname, '../tmp/SynCityPassesAddress'), addresses.SynCityPasses)
  await fs.writeFile(path.resolve(__dirname, '../tmp/SynCityPassesFactoryAddress'), addresses.SynCityPassesFactory)

  await exportABIs(Object.keys(addresses))
}

async function exportABIs(contracts) {
  const ABIs = {
    when: (new Date).toISOString(),
    contracts: {}
  }

  for (let name of contracts) {
    let source = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
    let json = require(source)
    ABIs.contracts[name] = json.abi
  }
  fs.writeFileSync(path.resolve(__dirname, '../export/ABIs.json'), JSON.stringify(ABIs, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

