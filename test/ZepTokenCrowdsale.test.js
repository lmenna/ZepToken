/**
 * @title ZepTokenCrowdsale.test.js
 * Unit tests for the ZepTokenCrowdsale crowdsale contract.  Tests are run using Mocha.
 *
 * Run these using...
 * > truffle test
 *
 */

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

  const ZepTokenCrowdsale = artifacts.require('ZepTokenCrowdsale');
  const ZepToken = artifacts.require('ZepToken');

contract('ZepTokenCrowdsale', function([_, wallet]) {

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
  });

  describe('crowdsale', function() {
    it('tracks the token', async function() {
      const token = await this.zepCrowdsale.token();
      token.should.equal(this.zepToken.address);
    });
  });
});
