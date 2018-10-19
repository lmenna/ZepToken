/**
 * @title ZepTokenCrowdsale.sol
 * @dev This is the crowd sale contract that will sell the ZepTokens.  It uses the
 * Crowdsale capabilities provided by openzeppelin-solidity.
 * It can also be used with other MintableTokens.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract ZepTokenCrowdsale is Crowdsale, MintedCrowdsale, CappedCrowdsale, TimedCrowdsale, WhitelistedCrowdsale, RefundableCrowdsale
{

  // Set investor limits.  Min and max on an aggregate basis.
  // Track limits in the mapping.
  uint256 public _investorMinCap = 10000000000000000; // 0.01 ETH
  uint256 public _investorMaxCap = 250000000000000000000; // 250 ETH
  mapping(address => uint256) public _investorContributions;

  // Crowdsale will run through serval phases.  Keep track of this in an enum.
  enum CrowdsalePhase { PreICO, PublicICO }
  CrowdsalePhase public phase = CrowdsalePhase.PreICO;

  /**
   *  @dev Constructor Constructor does nothing except call into constructors it inherits from.
   *  @param rate conversion rate between ETH and this token.
   *  @param wallet address for creator of the crowdsale
   *  @param token the ERC20 token this crowdsale will manage and create
   *  @param cap Maximum number of tokens that can be created.
   *  @param goal Minimum amount to be raised for the crowdsale to complete successfully
   */
  constructor(
    uint256 rate,
    address wallet,
    ERC20 token,
    uint256 cap,
    uint256 goal,
    uint256 openingTime,
    uint256 closingTime
  )
    Crowdsale(rate, wallet, token)
    CappedCrowdsale(cap)
    TimedCrowdsale(openingTime, closingTime)
    RefundableCrowdsale(goal)
    public
  {
      require(goal <= cap);
  }

  /**
   *  @dev _preValidatePurchase Extends validation of parent
   *  Add additional validation with a minimum and maximum contribution allows
   *  from each of the investors.  The mapping _investorContributions keeps track
   *  of how much each investor address has contributed.
   *  @param beneficiary address trying to purchase tokens
   *  @param weiAmount amount the beneficiary is attempting to purchase
   */
  function _preValidatePurchase(
    address beneficiary,
    uint weiAmount
    ) internal
  {
    super._preValidatePurchase(beneficiary, weiAmount);
    uint256 existingContributions = _investorContributions[beneficiary];
    uint256 newContribution = SafeMath.add(existingContributions, weiAmount);
    require(newContribution >= _investorMinCap);
    require(newContribution <= _investorMaxCap);
    _investorContributions[beneficiary] = newContribution;
  }

  /**
   *  @dev getUserContribution Provides access to how much an address has contributed to this crowdsale
   *  @param contributor Address of entity (validated seperately via KYC portal) that contributed to the crowd sale.
   *  @return Amount of tokens the contributor has purchased so far.
   */
  function getUserContribution(address contributor)
    public view returns(uint256)
  {
    return(_investorContributions[contributor]);
  }

  /**
   *  @dev setCrowdsalePhase Allows an admin to change which phase of the ICO we are in
   *  @param newPhase you want the ICO to be in
   */
  function setCrowdsalePhase(uint newPhase) onlyOwner public
  {
    if(uint(CrowdsalePhase.PreICO) == newPhase) {
      phase = CrowdsalePhase.PreICO;
    } else if (uint(CrowdsalePhase.PublicICO) == newPhase) {
      phase = CrowdsalePhase.PublicICO;
    }
    // Pre ICO rate is better than the public rate
    if(phase == CrowdsalePhase.PreICO) {
      rate = 250;
    }
    else if (phase == CrowdsalePhase.PublicICO) {
      rate = 500;
    }
  }

  /**
   * @dev The wallet receives funds during the PreICO phase, vault receives funds during the PublicICO phase
   */
  function _forwardFunds() internal {

    if(phase == CrowdsalePhase.PreICO) {
      wallet.transfer(msg.value);
    } else if (phase == CrowdsalePhase.PublicICO) {
      super._forwardFunds();
    }
  }

} // End of contract ZepTokenCrowdsale
