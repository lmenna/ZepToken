/**
 * @title ZepTokenCrowdsaleTimed.sol
 * @dev This is the crowd sale contract that will sell the ZepTokens.  It uses the
 * Crowdsale capabilities provided by openzeppelin-solidity.
 * It can also be used with other MintableTokens.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract ZepTokenTimedCrowdsale is MintedCrowdsale, CappedCrowdsale, TimedCrowdsale {

  // Set investor limits.  Min and max on an aggregate basis.
  // Track limits in the mapping.
  uint256 public _investorMinCap = 10000000000000000; // 0.01 ETH
  uint256 public _investorMaxCap = 250000000000000000000; // 250 ETH
  mapping(address => uint256) public _investorContributions;

  /**
   *  @dev Constructor Constructor does nothing except call into constructors it inherits from.
   *  @param rate conversion rate between ETH and this token.
   *  @param wallet address for creator of the crowdsale
   *  @param token the ERC20 token this crowdsale will manage and create
   *  @param cap Maximum number of tokens that can be created.
   *  @param openingTime Start time for tokens to be available for sale
   *  @param closingTime Time when token will no longer be avaialble for sale
   */
  constructor(
    uint256 rate,
    address wallet,
    ERC20 token,
    uint256 cap,
    uint256 openingTime,
    uint256 closingTime
  )
    Crowdsale(rate, wallet, token)
    CappedCrowdsale(cap)
    TimedCrowdsale(openingTime, closingTime)
    public
  {
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

} // End of contract ZepTokenCrowdsale
