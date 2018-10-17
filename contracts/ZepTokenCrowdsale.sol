/**
 * @title ZepTokenCrowdsale.sol
 * This is the crowd sale contract that will sell the ZepTokens.  It used the
 * Crowdsale capabilities provided by openzeppelin-solidity.
 * It can also be used with other MintableTokens.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";

contract ZepTokenCrowdsale is MintedCrowdsale {

  constructor(uint256 _rate, address _wallet, ERC20 _token)
    Crowdsale(_rate, _wallet, _token)
    public
  {
  }
}
