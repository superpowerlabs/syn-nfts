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

      async function batchTransfer(buyer, ids) {
        for (let i of ids) {
          await coupons.connect(marketplace)["safeTransferFrom(address,address,uint256)"](marketplace.address, buyer.address, i)
        }
      }    

      async function initAndDeploy() {
        coupons = await SynCityCoupons.deploy(20)
        await coupons.deployed()
        await coupons.selfSafeMint(19)
        await coupons.selfSafeMint(1)
        await coupons.setDepositAddress(marketplace.address)
        await coupons.batchTransfer(20)
        await batchTransfer(buyer1, [1, 3, 5])
        await batchTransfer(buyer2, [2, 12, 13, 14, 17])
        await batchTransfer(buyer3, [4, 6, 7, 9, 10, 11, 15])
        await batchTransfer(buyer4, [8,16, 18, 19, 20])
        
      }


      describe('constructor and initialization', async function () {

        beforeEach(async function () {
          await initAndDeploy()
        })

    
        it("should get max supply is 20", async function () {
           expect(await coupons.maxSupply()).equal(20)
        })

        it("should set deposit address", async function () {
             expect( await coupons.depositAddress()).equal(marketplace.address)
          })

          it("should batch transfer balances ", async function () {
            expect(await coupons.balanceOf(buyer1.address)).equal(3)
            expect(await coupons.balanceOf(buyer2.address)).equal(5)
            expect(await coupons.balanceOf(buyer3.address)).equal(7)
            expect(await coupons.balanceOf(buyer4.address)).equal(5)
            expect(await coupons.balanceOf(buyer5.address)).equal(0)
          })


        //   it("should not let you mint anymore tokens ", async function () {
        //      expect( async function() {  
        //             await coupons.selfSafeMint(100)    
        //     }).to.throw()
        //   })

        //   it("should burn token", async function () {
        //    await coupons.burn(1)
        //    expect(await coupons.balanceOf(buyer1.address)).equal(3)
        //  })





    
    
      })
})