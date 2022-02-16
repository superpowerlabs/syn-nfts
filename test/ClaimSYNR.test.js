// 1. deploy Syn Pass
// 2. deploy SYNR
// 3. deploy ClaimSYNR
// 4. transfer SYNR to ClaimSYNR and enable contract (read comments in ClaimSYNR.sol)
// 5. Mint Syn pass to user and claim SYNR

const {expect, assert} = require("chai")
const { ethers } = require("ethers")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')

describe("ClaimSYNR", function () {

    let ClaimSYNR
    let SynCityPasses
    let nft
    let nftAddress

    let addr0 = '0x0000000000000000000000000000000000000000'
    let owner,
        operator,
        validator,
        buyer1, buyer2,
        communityMenber1, communityMenber2, communityMenber3, communityMenber4, communityMenber5, communityMenber6,
        collector1, collector2


        before(async function () {
            ;[
              owner,
              operator,
              buyer1, buyer2,
              validator,
              communityMenber1, communityMenber2, communityMenber3, communityMenber4, communityMenber5, communityMenber6,
              collector1, collector2
            ] = await ethers.getSigners()
            initEthers(ethers)
            ClaimSYNR = await ethers.getContractFactory("ClaimSYNR")
            SynCityPasses = await ethers.getContractFactory("SynCityPasses")
            
          })

          async function initAndDeploy() {
            nft = await SynCityPasses.deploy(validator.address)
            await nft.deployed()
            nftAddress = nft.address
            await nft.setOperators([operator.address])
            console.log(await claim.deployed())
            SYNRtoken = await ethers.getContractFactory("ERC0")
            SYNR = await SYNRtoken.deploy("SYNR", "SYNR")
            claim = await ClaimSYNR.deploy(nftAddress , SYNR.address)
            
          }


          describe('constructor and initialization', async function () {

            beforeEach(async function () {
              await initAndDeploy()
              SYNR.mint(SYNR.address, 5)
            })


            

        
        
          })

})