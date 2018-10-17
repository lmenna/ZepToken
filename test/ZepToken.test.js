/**
 * @title ZepToken.test.js
 * Unit tests for ZepToken mintable, ERC20 tokens.  Tests are run using Mocha.
 *
 * Run these using...
 * > truffle test
 *
 */

 const BigNumber = web3.BigNumber;
const ZepToken = artifacts.require('ZepToken');
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ZepToken', accounts => {

  const _name = 'Zep Token';
  const _symbol = 'ZEP';
  const _decimals = 18;

  beforeEach(async function() {
      this.token = await ZepToken.new(_name, _symbol, _decimals);
  });
  console.log('Got the ZepToken');

  describe('token attributes', function() {
    it('has the correct name', async function() {
      const name = await this.token.name();
      name.should.equal(_name);
    });
  });
  describe('token attributes', function() {
    it('has the correct symbol', async function() {
      const symbol = await this.token.symbol();
      symbol.should.equal(_symbol);
    });
  });
  describe('token attributes', function() {
    it('has the correct decimals', async function() {
      const decimals = await this.token.decimals();
      decimals.should.be.bignumber.equal(_decimals);
    });
  });
});
