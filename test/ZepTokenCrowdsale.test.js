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
import { increaseTo, duration } from './helpers/Time';
import latestTime from './helpers/latestTime';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ZepTokenCrowdsale = artifacts.require('ZepTokenCrowdsale');
const ZepToken = artifacts.require('ZepToken');
const TokenTimelock = artifacts.require('./TokenTimelock');

contract('ZepTokenCrowdsale', function([_, wallet, investor1, investor2, foundersFund, partnersFund, developersFund]) {

  beforeEach(async function() {
    // For creating the ZepToken
    this.name = 'Zep Token';
    this.symbol = 'ZEP';
    this.decimals = 18;
    // A ZepToken is needed to test the ZepTokenCrowdsale
    this.zepToken = await ZepToken.new(
        this.name,
        this.symbol,
        this.decimals);

    // Config for creating the ZepTokenCrowdsale
    this.preICORate = 250;
    this.publicICORate = 500;
    this.wallet = wallet;
    this.cap = ether(5000);
    this.goalInt = 20;
    this.goal = ether(this.goalInt);
    this.investorMinCap = ether(0.01);
    this.investorHardCap = ether(250);
    // Config for the TimedCrowdsale
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);

    // ICO Phases
    this.preICOPhase = 0;
    this.publicICOPhase = 1;

    // Token distribution
    this.communityPercentage = 70;
    this.foundersPercentage = 10;
    this.partnersPercentage = 10;
    this.developersPercentage = 10;
    this.foundersFund = foundersFund;
    this.partnersFund = partnersFund;
    this.developersFund = developersFund;
    this.releaseTime = this.closingTime + duration.years(1);

    // Deploy a crowdsale with many features
    this.zepCrowdsale = await ZepTokenCrowdsale.new(
        this.preICORate,
        this.wallet,
        this.zepToken.address,
        this.cap,
        this.goal,
        this.openingTime,
        this.closingTime,
        this.foundersFund,
        this.partnersFund,
        this.developersFund,
        this.releaseTime
      );
      // Token should start out as paused and stay that way till the crowdsale is finalized
      await this.zepToken.pause();
      // Transfer ownership of the token to this crowdsale
      await this.zepToken.transferOwnership(this.zepCrowdsale.address);
      // Add some investors to the whitelist so we can test transactions
      await this.zepCrowdsale.addAddressesToWhitelist([investor1, investor2]);
      // Track the refund vault
      // this.vaultAddress = await this.zepCrowdsale.vault();
      // this.vault = RefundVault.at(this.vaultAddress)
      // Advance the time to be in the window where the crowdsale is open
      await increaseTo(this.openingTime + 10);
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
      rate.should.be.bignumber.equal(this.preICORate);
    });
  });

  describe('accepting payments', function() {
    it('should accept payments', async function() {
      await this.zepCrowdsale.sendTransaction({value: ether(1), from: investor1 }).should.be.fulfilled;
      // Investor2 buys some tokens for investor1
      await this.zepCrowdsale.buyTokens(investor1, {value: ether(1), from: investor2 }).should.be.fulfilled;
    });
  });

  describe('whitelisted Crowdsale', function() {
    it('rejects contributions from non-whitelisted addresses', async function() {
      // use default account as the one that is not whitelisted
      const notWhiteListed = _;
      await this.zepCrowdsale.sendTransaction({value: ether(1), from: notWhiteListed }).should.be.rejectedWith(revert);
    });
  });

  describe('Refundable Crowdsale', function() {
    beforeEach(async function() {
      await this.zepCrowdsale.buyTokens(investor1, {value: ether(1), from: investor1});
    });
    describe('during crowdsale', function() {
      it('prevents the investor from claiming refund', async function() {
        await this.zepCrowdsale.claimRefund().should.be.rejectedWith(revert);
      });
    });

    describe('when the crowdsale phase is PreICO', function() {
      beforeEach(async function() {
        // Should be in the preICOPhase by default
        await this.zepCrowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
      });

      it('forwards funds to the wallet', async function() {
        const balance = await web3.eth.getBalance(this.wallet);
        expect(balance.toNumber()).to.be.above(ether(100).toNumber());
      });
    });

    describe('when the crowdsale phase is PublicICO', function() {
      beforeEach(async function() {
        await this.zepCrowdsale.setCrowdsalePhase(this.publicICOPhase, { from: _ });
        await this.zepCrowdsale.buyTokens(investor1, { value: ether(1), from: investor1 });
      });

      it('forwards funds to the refund vault', async function() {
        const balance = await web3.eth.getBalance(this.wallet);
        expect(balance.toNumber()).to.be.above(0);
      });
    });

    it('rejects contributions from non-whitelisted addresses', async function() {
      // use default account as the one that is not whitelisted
      const notWhiteListed = _;
      await this.zepCrowdsale.sendTransaction({value: ether(1), from: notWhiteListed }).should.be.rejectedWith(revert);
    });
  });

  describe('Crowdsale Phases', function() {
    it('starts with PreICO phase', async function() {
      const currentPhase = await this.zepCrowdsale.phase();
      currentPhase.should.be.bignumber.equal(this.preICOPhase);
    });
    it('starts with rate set to be PreICO rate', async function() {
      const rate = await this.zepCrowdsale.rate();
      rate.should.be.bignumber.equal(this.preICORate);
    });
    it('allows admin to update the phase and rate', async function() {
      await this.zepCrowdsale.setCrowdsalePhase(this.publicICOPhase, { from: _ });
      const currentPhase = await this.zepCrowdsale.phase();
      currentPhase.should.be.bignumber.equal(this.publicICOPhase);
      const rate = await this.zepCrowdsale.rate();
      rate.should.be.bignumber.equal(this.publicICORate);
    });
    it('prevent a non admin from update the phase', async function() {
      await this.zepCrowdsale.setCrowdsalePhase(this.publicICOPhase, { from: investor1 }).should.be.rejectedWith(revert);
    });
  });

  describe('minted crowdsale', function() {
    it('mints tokens after purchase', async function() {
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

  // Tests for the CappedCrowdsale
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

    describe('token transfers', function() {
      const value = ether(2);
      it('reverts when trying to transfer tokens while paused during the crowdsale', async function() {
          // Investor1 buys some Tokens
          await this.zepCrowdsale.buyTokens(investor1, { value: ether(1), from: investor1 } );
          // Initiate a tranfer of these tokens
          await this.zepToken.transfer(investor2, 1, { from: investor1 }).should.be.rejectedWith(revert);
      });
    });

    describe('finalizing the crowdsale', function() {
      describe('when the goal is NOT reached', function() {
        beforeEach(async function() {
          // Invest less than the goal for the crowdsale to succeed
          const BT0 = await this.zepToken.balanceOf( investor2 );
          await this.zepCrowdsale.setCrowdsalePhase(this.publicICOPhase, { from: _ });
          await this.zepCrowdsale.buyTokens(investor2, { value: ether(1), from: investor2 });
          // Move forward in time past the end of the crowdsale
          await increaseTo(this.closingTime + 10);
          // Finalize the crowdsale
          await this.zepCrowdsale.finalize({ from: _});
        });
        it('allows investors to claim refunds', async function() {
          const BT1 = await this.zepToken.balanceOf( investor2 );
          await this.zepCrowdsale.claimRefund( { from: investor2 } ).should.be.fulfilled;
          const BT2 = await this.zepToken.balanceOf( investor2 );
        })
      });
      describe('when the goal is reached', function() {
        beforeEach(async function() {
          this.walletBalance = await web3.eth.getBalance(wallet);
          // Meet the crowdsale goal.
          await this.zepCrowdsale.buyTokens(investor1, { value: ether((this.goalInt / 2) + 1), from: investor1 });
          await this.zepCrowdsale.buyTokens(investor2, { value: ether((this.goalInt / 2) + 1), from: investor2 });
          // Move forward to closing time.
          await increaseTo(this.closingTime + 10);
          await this.zepCrowdsale.finalize( { from: _ });
        });

        it('handles goal reached', async function() {
          const goalReached = await this.zepCrowdsale.goalReached();
          goalReached.should.be.true;
          // Goal reach it should finish minting Tokens
          const mintingFinished = await this.zepToken.mintingFinished();
          mintingFinished.should.be.true;
          // When crowdsale is finished token should NOT be paused
          const paused = await this.zepToken.paused();
          paused.should.be.false;
          let totalSupply = await this.zepToken.totalSupply();
          totalSupply = totalSupply.toString();

          // Check distribution to Founders
          const releaseTime = await this.zepCrowdsale.releaseTime();
          const foundersTimelockAddr = await this.zepCrowdsale.foundersTimelockAddr();
          // Get balance from zepCrowdsale
          var foundersTimelockBalance = await this.zepToken.balanceOf(foundersTimelockAddr);
          foundersTimelockBalance = foundersTimelockBalance.toString();
          foundersTimelockBalance = foundersTimelockBalance / (10 ** this.decimals);
          // Get balance from this testing code
          let foundersAmount = totalSupply / this.foundersPercentage;
          foundersAmount = foundersAmount.toString();
          foundersAmount = foundersAmount / (10 ** this.decimals);
          // Verify balance from the zepCrowdsale and from this testing code match
          assert.equal(foundersTimelockBalance.toString(), foundersAmount.toString());

          // Can't withdraw from founders fund because of the timelock
          const foundersTimeLock = await TokenTimelock.at(foundersTimelockAddr);
          await foundersTimeLock.release().should.be.rejectedWith(revert);
          // Move past the lockup period and verify the timelock is released
          await increaseTo(this.releaseTime + 10);
          await foundersTimeLock.release().should.be.fulfilled;

          const partnersFundAddr = await this.zepCrowdsale.partnersFundAddr();
          const developersFundAddr = await this.zepCrowdsale.developersFundAddr();

          // Verify ownership went back to the wallet after the crowdsale has finished
          const owner = await this.zepToken.owner();
          owner.should.equal(this.wallet);
          // No refunds when goal is reached.
          await this.zepCrowdsale.claimRefund( { from: investor2 } ).should.be.rejectedWith(revert);
        })
      });
    });
  });

  describe('token distribution', function() {
    it('tracks token distribution correctly', async function() {
      const communityPercentage = await this.zepCrowdsale.communityPercentage();
      communityPercentage.should.be.bignumber.eq(this.communityPercentage, 'has correct communityPercentage');
      const foundersPercentage = await this.zepCrowdsale.foundersPercentage();
      foundersPercentage.should.be.bignumber.eq(this.foundersPercentage, 'has correct foundersPercentage');
      const partnersPercentage = await this.zepCrowdsale.partnersPercentage();
      partnersPercentage.should.be.bignumber.eq(this.partnersPercentage, 'has correct partnersPercentage');
      const developersPercentage = await this.zepCrowdsale.developersPercentage();
      developersPercentage.should.be.bignumber.eq(this.developersPercentage, 'has correct developersPercentage');
    });
    it('is a valid token distribution correctly', async function() {
      const communityPercentage = await this.zepCrowdsale.communityPercentage();
      const foundersPercentage = await this.zepCrowdsale.foundersPercentage();
      const partnersPercentage = await this.zepCrowdsale.partnersPercentage();
      const developersPercentage = await this.zepCrowdsale.developersPercentage();
      const total = communityPercentage.toNumber()
        + foundersPercentage.toNumber()
        + partnersPercentage.toNumber()
        + developersPercentage.toNumber();
      total.should.be.equal(100);
    });

  });

}); // Keep this as the end closing }) pair
