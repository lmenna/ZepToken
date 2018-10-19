/**
 * @title ZepTokenCrowdsaleTimed.sol
 * @dev This is the crowd sale contract that will sell the ZepTokens.  It uses the
 * Crowdsale capabilities provided by openzeppelin-solidity.
 * It can also be used with other MintableTokens.
 */

pragma solidity ^0.4.24;

import "./ZepTokenCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract ZepTokenTimedCrowdsale is ZepTokenCrowdsale, TimedCrowdsale {

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
    ZepTokenCrowdsale(rate, wallet, token, cap)
    TimedCrowdsale(openingTime, closingTime)
    public
  {
  }

} // End of contract ZepTokenTimedCrowdsale
