const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')

describe("SynNFTFactory", function () {

  let SynNFT
  let synNft
  let SynNFTFactory
  let synFactory
  let nftAddress
  let price
  let conf
  let maxAllocation
  let remainingFreeTokens

  let addr0 = '0x0000000000000000000000000000000000000000'
  let owner,
      treasury,
      validator,
      buyer1, buyer2,
      communityMenber1, communityMenber2, communityMenber3, communityMenber4, communityMenber5, communityMenber6,
      collector1, collector2

  before(async function () {
    ;[
      owner,
      treasury,
      buyer1, buyer2,
      validator,
      communityMenber1, communityMenber2, communityMenber3, communityMenber4, communityMenber5, communityMenber6,
      collector1, collector2
    ] = await ethers.getSigners()
    price = ethers.BigNumber.from('1' + '0'.repeat(17)) // 0.1 ETH
    maxAllocation = ethers.BigNumber.from(5)
    remainingFreeTokens = ethers.BigNumber.from(5)
    initEthers(ethers)
  })

  async function initAndDeploy() {
    SynNFT = await ethers.getContractFactory("SynNFT")
    synNft = await SynNFT.deploy('Blueprints', 'SBP', 'https://syn.io/meta/')
    await synNft.deployed()
    nftAddress = synNft.address

    SynNFTFactory = await ethers.getContractFactory("SynNFTFactory")
    synFactory = await SynNFTFactory.deploy()
    await synFactory.deployed()
    await synFactory.setValidatorAndTreasury(validator.address, treasury.address)
    synNft.setFactory(synFactory.address)
  }

  async function configure() {
    await synFactory.init(
        synNft.address,
        remainingFreeTokens
    )
    await synFactory.updatePriceAndMaxAllocation(
        synNft.address,
        price,
        maxAllocation
    )
  }

  describe('constructor and initialization', async function () {

    beforeEach(async function () {
      await initAndDeploy()
    })


    it("should return the SynNFT address", async function () {
      expect(await synFactory.validator()).to.equal(validator.address)
    })

    it("should initialize the factory", async function () {
      await configure()
      const conf = await synFactory.getNftConf(nftAddress)
      assert.equal(conf.nft, synNft.address)
      assert.equal(conf.price.toString(), price.toString())
      assert.equal(conf.maxAllocation.toString(), maxAllocation.toString())
      assert.equal(conf.paused, true)
    })

  })

  describe('sale is either not open or has been paused', async function () {

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
    })

    it("should throw if sale not started yet", async function () {

      await assertThrowsMessage(
          synFactory.buyTokens(nftAddress, 3, {
            value: price.mul(3)
          }),
          'sale is either not open or has been paused')

    })

    it("should throw if sale started but is currently paused in the meantime", async function () {

      await synFactory.openPauseSale(nftAddress, true)

      const conf = await synFactory.getNftConf(nftAddress)
      assert.equal(conf.paused, true)

      await assertThrowsMessage(
          synFactory.buyTokens(nftAddress, 3, {
            value: price.mul(3)
          }),
          'sale is either not open or has been paused')
    })

  })

  describe('#buyTokens', async function () {

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
      await synFactory.openPauseSale(nftAddress, false)
      const conf = await synFactory.getNftConf(nftAddress)
      assert.equal(conf.paused, false)
    })

    it("should buyer1 mint 1 tokens if sale started", async function () {

      await expect(await synFactory.connect(buyer1).buyTokens(nftAddress, 1, {
        value: price
      }))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 1)

    })

    it("should buyer1 mint 3 tokens if sale started", async function () {

      // start the sale:
      // await increaseBlockTimestampBy(3601)

      await expect(await synFactory.connect(buyer1).buyTokens(nftAddress, 3, {
        value: price.mul(3)
      }))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 1)
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 2)
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 3)

    })

    it("should throw if buyer1 try to mint 3 tokens with bad balance", async function () {

      // start the sale:
      // await increaseBlockTimestampBy(3601)

      await assertThrowsMessage(synFactory.connect(buyer1).buyTokens(nftAddress, 3, {
        value: price
      }), 'insufficient payment')

    })

  })

  describe('#claimAFreeToken', async function () {

    let tokens1
    let tokens2

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
      await synFactory.openPauseSale(nftAddress, false)
    })

    it("should communityMenber1 mint 2 tokens", async function () {

      const authCode = ethers.utils.id('a' + Math.random())

      const hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
      const signature = await signPackedData(hash)

      expect(await synFactory.connect(communityMenber1).claimAFreeToken(nftAddress, authCode, signature))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 1)

      const conf = await synFactory.getNftConf(nftAddress)
      expect(conf.remainingFreeTokens.toNumber(), 4)

    })

    it("should throw if someone gets a second code", async function () {

      let authCode = ethers.utils.id('a' + Math.random())
      let hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
      let signature = await signPackedData(hash)

      await synFactory.connect(communityMenber1).claimAFreeToken(nftAddress, authCode, signature)

      authCode = ethers.utils.id('a' + Math.random())
      hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
      signature = await signPackedData(hash)

      await assertThrowsMessage(synFactory.connect(communityMenber1)
              .claimAFreeToken(nftAddress, authCode, signature),
          'only one token per wallet')
    })


    it("should throw if no more tokens are available", async function () {

      let authCode
      let hash
      let signature

      let communityMembers = [
        communityMenber1,
        communityMenber2,
        communityMenber3,
        communityMenber4,
        communityMenber5
      ]

      for (let i = 0; i < 5; i++) {
        authCode = ethers.utils.id('a' + Math.random())
        hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMembers[i].address, nftAddress, authCode)
        signature = await signPackedData(hash)
        await synFactory.connect(communityMembers[i]).claimAFreeToken(nftAddress, authCode, signature)
      }

      const conf = await synFactory.getNftConf(nftAddress)
      expect(conf.remainingFreeTokens.toNumber(), 0)

      authCode = ethers.utils.id('a' + Math.random())
      hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber6.address, nftAddress, authCode)
      signature = await signPackedData(hash)

      await assertThrowsMessage(synFactory.connect(communityMenber6)
              .claimAFreeToken(nftAddress, authCode, signature),
          'no more free tokens available')
    })

    it("should throw calling from the wrong address", async function () {

      const authCode = ethers.utils.id('a' + Math.random())

      const hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
      const signature = await signPackedData(hash)

      await assertThrowsMessage(synFactory.connect(communityMenber2).claimAFreeToken(nftAddress, authCode, signature), 'invalid signature')

    })

  })

  describe('#buyDiscountedTokens', async function () {

    let tokens1
    let tokens2

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
      await synFactory.openPauseSale(nftAddress, false)
    })

    it("should buyer1 buy one discounted token", async function () {

      const quantity = 1
      const authCode = ethers.utils.id('a' + Math.random())
      const discountedPrice = price.div(100).mul(90)

      const hash = await synFactory['encodeForSignature(address,address,uint256,bytes32,uint256)'](buyer1.address, nftAddress, quantity, authCode, discountedPrice)
      const signature = await signPackedData(hash)

      expect(await synFactory.connect(buyer1).buyDiscountedTokens(nftAddress, quantity, authCode, discountedPrice, signature, {
        value: discountedPrice
      }))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 1)

    })

    it("should throw trying to reuse same code/signature", async function () {

      const quantity = 1
      const authCode = ethers.utils.id('a' + Math.random())
      const discountedPrice = price.div(100).mul(90)

      const hash = await synFactory['encodeForSignature(address,address,uint256,bytes32,uint256)'](buyer1.address, nftAddress, quantity, authCode, discountedPrice)
      const signature = await signPackedData(hash)

      expect(await synFactory.connect(buyer1).buyDiscountedTokens(nftAddress, quantity, authCode, discountedPrice, signature, {
        value: discountedPrice
      }))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, buyer1.address, 1)

      await assertThrowsMessage(synFactory.connect(buyer1).buyDiscountedTokens(nftAddress, quantity, authCode, discountedPrice, signature, {
        value: discountedPrice
      }), 'authCode already used')

    })

  })

  describe('#giveawayTokens', async function () {

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
    })

    it("should owner giveaway 2 tokens to collector1 and 1 to collector 2", async function () {

      const recipients = [communityMenber1.address, communityMenber2.address]
      const quantities = [2, 1]

      await expect(await synFactory.giveawayTokens(nftAddress, recipients, quantities))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 1)
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 2)
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber2.address, 3)

    })

    it("should owner giveaway 100 tokens to a single wallet", async function () {

      const recipients = [communityMenber1.address]
      const quantities = [20]

      await expect(await synFactory.giveawayTokens(nftAddress, recipients, quantities))
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 1)
          .to.emit(synNft, 'Transfer')
          .withArgs(addr0, communityMenber1.address, 19)

    })

  })


  describe('#withdrawProceeds', async function () {

    beforeEach(async function () {
      await initAndDeploy()
      await configure()
      await synFactory.openPauseSale(nftAddress, false)
    })

    it("after 10 token sold should withdraw the proceeds", async function () {

      // start the sale:
      // await increaseBlockTimestampBy(3601)

      await expect(await synFactory.connect(buyer1).buyTokens(nftAddress, 3, {
        value: price.mul(3)
      }))
      await expect(await synFactory.connect(buyer1).buyTokens(nftAddress, 2, {
        value: price.mul(2)
      }))
      await expect(await synFactory.connect(buyer2).buyTokens(nftAddress, 5, {
        value: price.mul(5)
      }))
      await expect(await synFactory.connect(collector1).buyTokens(nftAddress, 3, {
        value: price.mul(3)
      }))
      await expect(await synFactory.connect(collector2).buyTokens(nftAddress, 3, {
        value: price.mul(3)
      }))
      await expect(await synFactory.connect(collector2).buyTokens(nftAddress, 2, {
        value: price.mul(2)
      }))

      // claimed for free
      let authCode = ethers.utils.id('a' + Math.random())

      let hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
      let signature = await signPackedData(hash)

      await synFactory.connect(communityMenber1).claimAFreeToken(nftAddress, authCode, signature)

      // discounted

      let quantity = 2

      authCode = ethers.utils.id('b' + Math.random())
      let discountedPrice = price.div(100).mul(90)

      hash = await synFactory['encodeForSignature(address,address,uint256,bytes32,uint256)'](communityMenber2.address, nftAddress, quantity, authCode, discountedPrice)
      signature = await signPackedData(hash)

      expect(await synFactory.connect(communityMenber2).buyDiscountedTokens(nftAddress, quantity, authCode, discountedPrice, signature, {
        value: discountedPrice.mul(quantity)
      }))

      const totalProceeds = price.mul(18).add(discountedPrice.mul(quantity))

      const conf = await synFactory.getNftConf(nftAddress)
      expect(await ethers.provider.getBalance(synFactory.address)).equal(totalProceeds)

      const treasuryBalance = await ethers.provider.getBalance(treasury.address)

      const thertyPercent = totalProceeds.mul(3).div(10)
      await synFactory.connect(treasury).withdrawProceeds(thertyPercent)

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address)

      const possibleUsedGas = ethers.BigNumber.from('2000000000000000')

      assert.isTrue(treasuryBalanceAfter.gt(treasuryBalance.add(thertyPercent).sub(possibleUsedGas)))
      assert.isTrue(treasuryBalanceAfter.lt(treasuryBalance.add(thertyPercent)))
      expect(await ethers.provider.getBalance(synFactory.address)).equal(totalProceeds.mul(7).div(10))
      await synFactory.connect(treasury).withdrawProceeds(0)
      expect(await ethers.provider.getBalance(synFactory.address)).equal(0)

    })

  })

})
