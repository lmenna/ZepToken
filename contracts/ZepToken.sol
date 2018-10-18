/**
 * @title ZepToken.sol
 * Very simple ERC20 Token based on the openzeppelin-solidity package.
 * This token can be minted and used in a crowdsale contract.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract ZepToken is MintableToken, PausableToken, DetailedERC20 {

constructor(string name, string symbol, uint8 decimals)
  DetailedERC20(name, symbol, decimals)
  public {

  }
}
