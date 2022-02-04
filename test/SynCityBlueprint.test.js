const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')

// tests to be fixed

describe.only("SynCityBlueprint", function () {

  let SynCityCoupons, coupons,
      SynCityBlueprints, blueprints

  let owner, operator, validator, buyer1, buyer2, buyer3, buyer4, buyer5, marketplace

  before(async function () {
    [owner, operator, buyer1, buyer2, validator, buyer3, buyer4, buyer5, marketplace] = await ethers.getSigners()
    initEthers(ethers)
    SynCityCoupons = await ethers.getContractFactory("SynCityCoupons")
    SynCityBlueprints = await ethers.getContractFactory("SynCityBlueprints")
  })

  async function batchTransfer(buyer, ids) {
    for (let i of ids) {
      await coupons.connect(marketplace)["safeTransferFrom(address,address,uint256)"](marketplace.address, buyer.address, i)
    }
  }

  async function initAndDeploy() {
    coupons = await SynCityCoupons.deploy(20)
    await coupons.deployed()
    await coupons.selfSafeMint(20)
    await coupons.setDepositAddress(marketplace.address)
    await coupons.batchTransfer(20)
    await batchTransfer(buyer1, [1, 3, 5])
    await batchTransfer(buyer2, [2, 12, 13, 14, 17])
    await batchTransfer(buyer3, [4, 6, 7, 9, 10, 11, 15])
    await batchTransfer(buyer4, [8, 18, 19, 20])
    await batchTransfer(buyer5, [16])
    blueprints = await SynCityBlueprints.deploy(coupons.address, validator.address)
    await blueprints.deployed()
    await expect(coupons.setSwapper(blueprints.address))
        .emit(coupons, 'SwapperSet')
        .withArgs(blueprints.address)
  }

  describe('constructor and initialization', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should return the SynCityCoupons address", async function () {
      await expect(await coupons.maxSupply()).equal(20)
      await expect(await blueprints.validator()).equal(validator.address)
      await expect(await blueprints.coupons()).equal(coupons.address)
    })


  })

  describe('#swapTokenFromCoupon', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should buyer1 have her tokens", async function () {

      await expect(await coupons.balanceOf(buyer1.address)).equal(3)
      await blueprints.connect(buyer1).swapTokenFromCoupon(0)
      await expect(await coupons.balanceOf(buyer1.address)).equal(0)
      await expect(await blueprints.balanceOf(buyer1.address)).equal(3)

    })

    it("should buyer3 swap her tokens in two steps", async function () {

      // 4, 6, 7, 9, 10, 11, 15
      await expect(await coupons.balanceOf(buyer3.address)).equal(7)
      await blueprints.connect(buyer3).swapTokenFromCoupon(3)
      await expect(await coupons.balanceOf(buyer3.address)).equal(4)
      await expect(await blueprints.balanceOf(buyer3.address)).equal(3)

      await blueprints.connect(buyer3).swapTokenFromCoupon(4)
      await expect(await coupons.balanceOf(buyer3.address)).equal(0)
      await expect(await blueprints.balanceOf(buyer3.address)).equal(7)

    })

    it("should throw if trying to re-swap", async function () {
      await blueprints.connect(buyer1).swapTokenFromCoupon(0)
      await assertThrowsMessage(
          blueprints.connect(buyer1).swapTokenFromCoupon(0),
          'no tokens here'
      )
    })

  })


  describe('#claimTokenFromPass', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should buyer2 claim one pass", async function () {

      const hash = await blueprints.encodeForSignature(buyer2.address, [163])
      const signature = await signPackedData(hash)

      await expect(await blueprints.connect(buyer2).claimTokenFromPass([163], signature))
          .to.emit(blueprints, 'Transfer')
          .withArgs(ethers.constants.AddressZero, buyer2.address, 8163)

    })

    it("should buyer2 claim three pass", async function () {

      const hash = await blueprints.encodeForSignature(buyer2.address, [163, 354, 884])
      const signature = await signPackedData(hash)

      await expect(await blueprints.connect(buyer2).claimTokenFromPass([163, 354, 884], signature))
          .to.emit(blueprints, 'Transfer')
          .withArgs(ethers.constants.AddressZero, buyer2.address, 8163)
          .to.emit(blueprints, 'Transfer')
          .withArgs(ethers.constants.AddressZero, buyer2.address, 8354)
          .to.emit(blueprints, 'Transfer')
          .withArgs(ethers.constants.AddressZero, buyer2.address, 8884)

    })


    it("should throw if invalid signature", async function () {

      const hash = await blueprints.encodeForSignature(buyer2.address, [163])
      const signature = await signPackedData(hash)

      await assertThrowsMessage(
          blueprints.connect(buyer2).claimTokenFromPass([233], signature),
          'invalid signature'
      )

    })

    it("should throw if trying to re-claim", async function () {

      let hash = await blueprints.encodeForSignature(buyer2.address, [163])
      let signature = await signPackedData(hash)
      await blueprints.connect(buyer2).claimTokenFromPass([163], signature)
      await assertThrowsMessage(
          blueprints.connect(buyer2).claimTokenFromPass([163], signature),
          'token already minted'
      )
    })

    it("should throw if trying to re-claim", async function () {

      let hash = await blueprints.encodeForSignature(buyer4.address, [733])
      let signature = await signPackedData(hash)
      await blueprints.connect(buyer4).claimTokenFromPass([733], signature)

      hash = await blueprints.encodeForSignature(buyer4.address, [3, 13, 733])
      signature = await signPackedData(hash)
      await assertThrowsMessage(
          blueprints.connect(buyer4).claimTokenFromPass([3, 13, 733], signature),
          'token already minted'
      )

    })

  })

})
