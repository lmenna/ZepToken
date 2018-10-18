/**
 * @title ZepTokenCrowdsale.test.js
 * Unit tests for the ZepTokenCrowdsale crowdsale contract.  Tests are run using Mocha.
 *
 * Run these using...
 * > truffle test
 *
 */

import ether from './helpers/Ether';
import revert from './helpers/Revert';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ZepTokenCrowdsale = artifacts.require('ZepTokenCrowdsale');
const ZepToken = artifacts.require('ZepToken');

contract('ZepTokenCrowdsale', function([_, wallet, investor1, investor2]) {

  console.log("wallet:", wallet, " investor1:", investor1, " investor2:", investor2);
  beforeEach(async function() {
    // For creating the ZepToken
    this.name = 'Zep Token';
    this.symbol = 'ZEP';
    this.decimals = 18;
    // A ZepToken is needed to test the ZepTokenCrowdsale
    console.log("Creating ZepToken(name=", this.name,",symbol=",this.symbol,",decimals=",this.decimals,")" );
    this.zepToken = await ZepToken.new(
        this.name,
        this.symbol,
        this.decimals);

    // Config for creating the ZepTokenCrowdsale
    this.rate = 500;
    this.wallet = wallet;
    this.cap = ether(5000);
    this.investorMinCap = ether(0.01);
    this.investorHardCap = ether(250);

    // Deploy the ZepTokenCrowdsale
    console.log("Creating ZepTokenCrowdsale(rate=", this.rate,
      ",wallet=",this.wallet,
      ",address=", this.zepToken.address,
      ",cap=", this.cap,
      ")" );
    this.zepCrowdsale = await ZepTokenCrowdsale.new(
        this.rate,
        this.wallet,
        this.zepToken.address,
        this.cap
      );
    await this.zepToken.transferOwnership(this.zepCrowdsale.address);
  });

  describe('crowdsale', function() {
    it('tracks the token', async function() {
      const token = await this.zepCrowdsale.token();
      token.should.equal(this.zepToken.address);
    });
    it('tracks the wallet', async function() {
      const wallet = await this.zepCrowdsale.wallet();
      wallet.should.equal(this.wallet);
    });
    it('tracks the rate', async function() {
      const rate = await this.zepCrowdsale.rate();
      rate.should.be.bignumber.equal(this.rate);
    });
  });

  describe('accepting payments', function() {
    it('should accept payments', async function() {
      await this.zepCrowdsale.sendTransaction({value: ether(1), from: investor1 }).should.be.fulfilled;
      // Investor2 buys some tokens for investor1
      await this.zepCrowdsale.buyTokens(investor1, {value: ether(1), from: investor2 }).should.be.fulfilled;
    });
  });

  describe('minted crowdsale', function() {
    it('mint tokens after purchase', async function() {
      const originalTotalSupply = await this.zepToken.totalSupply();
      await this.zepCrowdsale.sendTransaction({value: ether(1), from: investor1 });
      const newTotalSupply = await this.zepToken.totalSupply();
      assert.isTrue(newTotalSupply > originalTotalSupply);
    });
  });

  describe('capped crowdsale', function() {
    it('has the correct hard cap', async function() {
      const cap = await this.zepCrowdsale.cap();
      cap.should.be.bignumber.equal(this.cap);
    });
  });

  describe('buyTokens with caps', function() {
    describe('contribution less than minimum amount.', function() {
      it('mint tokens after purchase', async function() {
        const value = this.investorMinCap - 10;
        await this.zepCrowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.rejectedWith(revert);
      });
    });
    describe('when investor has met the minimum cap', function() {
      it('allow the investor to contribute below the minimum cap', async function() {
        // Contribute a valid amount over the minimum and less than the Maximum
        const value1 = ether(1);
        await this.zepCrowdsale.buyTokens(investor1, {value: value1, from: investor1});
        // Next contribute and additional increment below the minimum.  Should work
        // because net the investor is above the min
        const value2 = 10;
        await this.zepCrowdsale.buyTokens(investor1, {value: value2, from: investor1}).should.be.fulfilled;
      });
    });
    describe('when investor exceeds the hard cap', function() {
      it('above hard cap reject the transaction', async function() {
        // Contribute a valid amount over the minimum and less than the Maximum
        const value1 = ether(1);
        await this.zepCrowdsale.buyTokens(investor1, {value: value1, from: investor1});
        // Now contribute an amout that breaks through the hard cap
        const value2 = ether(250);
        await this.zepCrowdsale.buyTokens(investor1, {value: value2, from: investor1}).should.be.rejectedWith(revert);
      });
    });
    describe('when contribution is in the valid range', function() {
      it('succeeds and updates the contribution amount', async function() {
        // Contribute a valid amount over the minimum and less than the Maximum
        const value1 = ether(1);
        await this.zepCrowdsale.buyTokens(investor1, {value: value1, from: investor1}).should.be.fulfilled;
        const contribution = await this.zepCrowdsale.getUserContribution(investor1);
        contribution.should.be.bignumber.equal(value1);
      });
    });
  });


}); // Keep this as the end closing }) pair
