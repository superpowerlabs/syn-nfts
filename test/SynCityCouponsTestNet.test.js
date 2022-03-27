const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')


describe("SynCityCouponsTestNet", function () {


    let SynCityCoupons, coupons

    let owner, operator, validator, buyer1, buyer2, buyer3, buyer4, buyer5, marketplace


    before(async function () {
        [owner, operator, buyer1, buyer2, validator, buyer3, buyer4, buyer5, marketplace] = await ethers.getSigners()
        initEthers(ethers)
        SynCityCoupons = await ethers.getContractFactory("SynCityCouponsTestNet")
      })

      async function initAndDeploy() {
        coupons = await SynCityCoupons.deploy(50)
        await coupons.deployed()
      }

      describe('constructor and initialization', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

        it("should verify that the max supply is correct", async function () {
           expect(await coupons.maxSupply()).equal(50)
        })

        it("should verify that name and symbol are correct", async function () {
          expect(await coupons.name()).equal('Syn City Blueprint Coupons')
          expect(await coupons.symbol()).equal('SYNBC')
        })

      })

      describe('#mint tokens', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

        it('should mint 10 tokens to buyer1', async function () {

          expect(await coupons.mint(buyer1.address, 10))
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, buyer1.address, 1)
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, buyer1.address, 5)
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, buyer1.address, 10)

          expect(await coupons.balanceOf(buyer1.address)).equal(10)

        })

      })
})
