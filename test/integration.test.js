const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')

// tests to be fixed

describe("Integration test", function () {

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
    SynCityPasses = await ethers.getContractFactory("SynCityPassesMock")
    nft = await SynCityPasses.deploy(validator.address)
    await nft.deployed()
    nftAddress = nft.address
    await nft.setOperators([operator.address])
  }

  async function configure() {
  }

  describe('constructor and initialization', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })


    it("should return the SynCityPasses address", async function () {
      await expect(await nft.validator()).to.equal(validator.address)
    })


  })

  describe('#claimFreeToken', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should communityMenber1 mint a free token", async function () {

      const authCode = ethers.utils.id('a' + Math.random())

      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      const signature = await signPackedData(hash)

      await expect(await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature))
          .to.emit(nft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 9)

      assert.equal(await nft.usedCodes(authCode), communityMenber1.address)

      const remaining = await nft.getRemaining(0)
      assert.equal(remaining, 1)

    })

    it("should mint all the tokens", async function () {

      let authCode = ethers.utils.id('a' + Math.random())

      let hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      let signature = await signPackedData(hash)

      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber2.address, authCode, 0)
      signature = await signPackedData(hash)

      await nft.connect(communityMenber2).claimFreeToken(authCode, 0, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber3.address, authCode, 1)
      signature = await signPackedData(hash)

      await nft.connect(communityMenber3).claimFreeToken(authCode, 1, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber4.address, authCode, 1)
      signature = await signPackedData(hash)

      await nft.connect(communityMenber4).claimFreeToken(authCode, 1, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber5.address, authCode, 2)
      signature = await signPackedData(hash)

      await nft.connect(communityMenber5).claimFreeToken(authCode, 2, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber6.address, authCode, 2)
      signature = await signPackedData(hash)

      await nft.connect(communityMenber6).claimFreeToken(authCode, 2, signature)

      assert.equal(await nft.getRemaining(0), 0)
      assert.equal(await nft.getRemaining(1), 0)
      assert.equal(await nft.getRemaining(2), 0)

      assert.equal(await nft.ownerOf(1), '0x70f41fE744657DF9cC5BD317C58D3e7928e22E1B')

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(collector1.address, authCode, 2)
      signature = await signPackedData(hash)

      await assertThrowsMessage(
          nft.connect(collector1).claimFreeToken(authCode, 2, signature),
          'no more tokens for this season'
      )

    })

  })


})
