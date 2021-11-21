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
    nft = await SynCityPasses.deploy('https://some.io/meta/')
    await nft.deployed()
    nftAddress = nft.address
    await nft.setValidatorAndOperator(validator.address, operator.address)
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

    let tokens1
    let tokens2

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

    // it("should throw if someone gets a second code", async function () {
    //
    //   let authCode = ethers.utils.id('a' + Math.random())
    //   let hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
    //   let signature = await signPackedData(hash)
    //
    //   await synFactory.connect(communityMenber1).claimAFreeToken(nftAddress, authCode, signature)
    //
    //   authCode = ethers.utils.id('a' + Math.random())
    //   hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
    //   signature = await signPackedData(hash)
    //
    //   await assertThrowsMessage(synFactory.connect(communityMenber1)
    //           .claimAFreeToken(nftAddress, authCode, signature),
    //       'only one token per wallet')
    // })
    //
    //
    // it("should throw if no more tokens are available", async function () {
    //
    //   let authCode
    //   let hash
    //   let signature
    //
    //   let communityMembers = [
    //     communityMenber1,
    //     communityMenber2,
    //     communityMenber3,
    //     communityMenber4,
    //     communityMenber5
    //   ]
    //
    //   for (let i = 0; i < 5; i++) {
    //     authCode = ethers.utils.id('a' + Math.random())
    //     hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMembers[i].address, nftAddress, authCode)
    //     signature = await signPackedData(hash)
    //     await synFactory.connect(communityMembers[i]).claimAFreeToken(nftAddress, authCode, signature)
    //   }
    //
    //   const conf = await synFactory.getNftConf(nftAddress)
    //   expect(conf.remainingFreeTokens.toNumber(), 0)
    //
    //   authCode = ethers.utils.id('a' + Math.random())
    //   hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber6.address, nftAddress, authCode)
    //   signature = await signPackedData(hash)
    //
    //   await assertThrowsMessage(synFactory.connect(communityMenber6)
    //           .claimAFreeToken(nftAddress, authCode, signature),
    //       'no more free tokens available')
    // })
    //
    // it("should throw calling from the wrong address", async function () {
    //
    //   const authCode = ethers.utils.id('a' + Math.random())
    //
    //   const hash = await synFactory['encodeForSignature(address,address,bytes32)'](communityMenber1.address, nftAddress, authCode)
    //   const signature = await signPackedData(hash)
    //
    //   await assertThrowsMessage(synFactory.connect(communityMenber2).claimAFreeToken(nftAddress, authCode, signature), 'invalid signature')
    //
    // })

  })

})
