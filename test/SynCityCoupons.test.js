const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')


describe.only("SynCityCoupons", function () {


    let SynCityCoupons, coupons

    let owner, operator, validator, buyer1, buyer2, buyer3, buyer4, buyer5, marketplace


    before(async function () {
        [owner, operator, buyer1, buyer2, validator, buyer3, buyer4, buyer5, marketplace] = await ethers.getSigners()
        initEthers(ethers)
        SynCityCoupons = await ethers.getContractFactory("SynCityCoupons")
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

      describe.only('#selfSafeMint', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

        it('should mint 10 tokens', async function () {

          expect(await coupons.selfSafeMint(10))
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, owner.address, 1)
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, owner.address, 5)
              .to.emit(coupons, 'Transfer')
              .withArgs(ethers.constants.AddressZero, owner.address, 10)

          expect(await coupons.balanceOf(owner.address)).equal(10)

        })

        it('should verify that if I mint 30 before and 20 later I get 50 in total', async function () {
          await coupons.selfSafeMint(30)
          await coupons.selfSafeMint(20)
          expect(await coupons.balanceOf(owner.address)).equal(50)
        })

        it('should verify that mintEnded is true if minting 50 tokens', async function () {
          await coupons.selfSafeMint(49)
          expect(await coupons.mintEnded()).equal(false)
          await coupons.selfSafeMint(1)
          expect(await coupons.mintEnded()).equal(true)
        })

        it('should revert if I mint 30 before and 30 later', async function () {
          await coupons.selfSafeMint(30)

          await assertThrowsMessage(
              coupons.selfSafeMint(30),
              'not enough token to be minted'
          )

        })

        it('should revert if I mint is ended', async function () {
          await coupons.selfSafeMint(50)

          await assertThrowsMessage(
              coupons.selfSafeMint(30),
              'minting ended'
          )

        })

      })
})
