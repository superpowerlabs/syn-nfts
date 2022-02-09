const {expect, assert} = require("chai")

const {initEthers, assertThrowsMessage, signPackedData, getTimestamp, increaseBlockTimestampBy} = require('./helpers')


describe("SynCityCoupons", function () {


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

      describe('#selfSafeMint', async function () {

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

      describe('#setSwapper ', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

        it("should verify that the default swapper address is 0x0", async function () {
            expect(await coupons.depositAddress()).equal("0x0000000000000000000000000000000000000000")
         })
        it("should verify that setSwapper address is working", async function () {
          await coupons.setSwapper(operator.address)
          expect(await coupons.swapper()).equal(operator.address)
        })
      })

      describe('#setDepositAddress ', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

        it("should verify that the default deposit address is 0x0", async function () {
            
           expect(await coupons.depositAddress()).equal("0x0000000000000000000000000000000000000000")
        })
        it("should test that setDepositAddress sets the address properly", async function () {
            await coupons.setDepositAddress(buyer1.address)
            expect(await coupons.depositAddress()).equal(buyer1.address)
         })

      })


      describe('#batchTransfer', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

      it('should revert when minting has not ended', async function () {

        await assertThrowsMessage(
            coupons.batchTransfer(30),
            'minting not ended yet'
        )

      })

      it('should revert when minting is complete but deposit adsress is not set', async function () {
         await coupons.selfSafeMint(50)
        await assertThrowsMessage(
            coupons.batchTransfer(30),
            'transfer to the zero address'
        )
        })

        it('should work when minting is complete and deposit address is set', async function () {
            await coupons.selfSafeMint(50)
            await coupons.setDepositAddress(buyer1.address)
            await coupons.batchTransfer(30)
            expect(await coupons.balanceOf(buyer1.address)).equal(30)
           })
    })


    describe.only('#burn ', async function () {
        beforeEach(async function () {
          await initAndDeploy()
        })

        it("should revert if not swapper", async function () {
            await coupons.selfSafeMint(50)
            await assertThrowsMessage(
                coupons.burn(30),
                'forbidden'
            )
         })

        it("should work when connected as swapper", async function () {
          await coupons.selfSafeMint(50)
          expect(await coupons.balanceOf(owner.address)).equal(50)
          await coupons.setSwapper(operator.address)
          await coupons.connect(operator).burn(10)
          expect(await coupons.balanceOf(owner.address)).equal(49)
          await coupons.connect(operator).burn(11)
          await coupons.connect(operator).burn(12)
          await coupons.connect(operator).burn(13)
          await coupons.connect(operator).burn(14)
          expect(await coupons.balanceOf(owner.address)).equal(45)
        })

        it("should revert if burn non existent token id", async function () {
            await coupons.selfSafeMint(50)
            await coupons.setSwapper(operator.address)
            await coupons.connect(operator).burn(1)
            await assertThrowsMessage(
                coupons.connect(operator).burn(1),
                'owner query for nonexistent token'
            )
         })
      })
})
