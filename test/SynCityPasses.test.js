const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, getBlockNumber, increaseBlockTimestampBy} = require('./helpers')

// tests to be fixed

describe("SynCityPasses", function () {

  let SynCityPasses
  let ClaimSYNR
  let claim
  let SynrMock
  let SYNR
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
    ClaimSYNR = await ethers.getContractFactory("ClaimSYNR")
    SynrMock = await ethers.getContractFactory("SynrMock")
    SynCityPasses = await ethers.getContractFactory("SynCityPasses")
    initEthers(ethers)
  })

  async function initAndDeploy() {
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
      assert.equal(remaining, 199)

    })

    it("should throw trying to mint 2 token same wallet", async function () {

      let authCode = ethers.utils.id('a' + Math.random())

      let hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      let signature = await signPackedData(hash)

      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)

      authCode = ethers.utils.id('b' + Math.random())
      hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      signature = await signPackedData(hash)

      await assertThrowsMessage(
          nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature),
          'one pass per wallet'
      )

    })

    it("should throw trying to reuse same code", async function () {

      let authCode = ethers.utils.id('a' + Math.random())

      let hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      let signature = await signPackedData(hash)

      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)

      await assertThrowsMessage(
          nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature),
          'authCode already used'
      )

    })

  })

  describe('#giveawayToken', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })

    it("should give a token to communityMember1", async function () {

      const authCode = ethers.utils.id('a' + Math.random())

      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 4)
      const signature = await signPackedData(hash)

      await expect(await nft.connect(operator).giveawayToken(communityMenber1.address, authCode, signature))
          .to.emit(nft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 9)

      assert.equal(await nft.usedCodes(authCode), communityMenber1.address)

      const remaining = await nft.getRemaining(4)
      assert.equal(remaining, 79)

    })

  })

  describe('#ClaimSYNR', async function () {

    let totalAmount = ethers.BigNumber.from(15000 + '0'.repeat(18)).mul(888)
    let rewardAmount = ethers.BigNumber.from(15000 + '0'.repeat(18))

    beforeEach(async function () {
      await initAndDeploy()
      SYNR = await SynrMock.deploy()
      claim = await ClaimSYNR.deploy(nftAddress , SYNR.address)
    })

    async function getBlockNumberInTheFuture() {
      return (await getBlockNumber()) + 3
    }

    it("should allow enable if Contract has required SYNR", async function () {

      SYNR.mint(claim.address, totalAmount)
      await claim.enable(await getBlockNumberInTheFuture())
      await increaseBlockTimestampBy(1000)
      expect(await claim.enabled()).to.be.true

    })

    it('should revert if try enable with insufficient SYNR', async function () {

      await assertThrowsMessage(
        claim.enable(await getBlockNumber()),
          'Not enough SYNR'
      )
    })

    it("should allow Claim ", async function () {

      const authCode = ethers.utils.id('a' + Math.random())
      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      const signature = await signPackedData(hash)
      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)


      SYNR.mint(claim.address, totalAmount)
      await claim.enable(await getBlockNumberInTheFuture())
      await increaseBlockTimestampBy(1000)

      expect(await SYNR.balanceOf(communityMenber1.address)).equal(0)

      await claim.connect(communityMenber1).claim(9)

      expect(await SYNR.balanceOf(communityMenber1.address)).equal(rewardAmount)

    })

    it("should revert if  Claim without enable", async function () {

      const authCode = ethers.utils.id('a' + Math.random())
      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      const signature = await signPackedData(hash)
      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)
      SYNR.mint(claim.address, totalAmount)

      await assertThrowsMessage(
        claim.connect(communityMenber1).claim(9),
           'Contract not enabled'
       )
     })


    it('should revert if try claim without being owner', async function () {
      const authCode = ethers.utils.id('a' + Math.random())
      const hash = await nft.encodeForSignature(communityMenber1.address, authCode, 0)
      const signature = await signPackedData(hash)
      await nft.connect(communityMenber1).claimFreeToken(authCode, 0, signature)

      SYNR.mint(claim.address, totalAmount)
      await claim.enable(await getBlockNumberInTheFuture())
      await increaseBlockTimestampBy(1000)

      await assertThrowsMessage(
       claim.connect(communityMenber2).claim(9),
          'Only onwer can claim'
      )
    })

  })

})
