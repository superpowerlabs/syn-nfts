const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')

// tests to be fixed

describe("SynNFTFactory", function () {

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
  })

  async function initAndDeploy() {
    SynCityPasses = await ethers.getContractFactory("SynCityPasses")
    nft = await SynCityPasses.deploy('https://some.io/meta/', validator.address)
    await nft.deployed()
    nftAddress = nft.address
  }

  async function configure() {
  }

  describe('constructor and initialization', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })


    it("should return the SynCityPasses address", async function () {
      expect(await nft.validator()).to.equal(validator.address)
    })


  })

  describe('#claimFreeToken', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should communityMenber1 mint 1 free token", async function () {

      const authCode = ethers.utils.id('a' + Math.random())

      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      const signature = await signPackedData(hash)

      expect(await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature))
          .to.emit(nft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 1)

      const remaining = await nft.getRemaining()
      expect(remaining[0], 749)

    })

  })

})
