/**
 * @title ZepTokenCrowdsale.test.js
 * Unit tests for the ZepTokenCrowdsale crowdsale contract.  Tests are run using Mocha.
 *
 * Run these using...
 * > truffle test
 *
 */

import ether from './helpers/ether';

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
    // Deploy the ZepTokenCrowdsale
    console.log("Creating ZepTokenCrowdsale(rate=", this.rate,",wallet=",this.wallet,",address=",this.zepToken.address,")" );
    this.zepCrowdsale = await ZepTokenCrowdsale.new(
        this.rate,
        this.wallet,
        this.zepToken.address);
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
});
