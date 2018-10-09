const ZepToken = artifacts.require("./ZepToken.sol");

module.exports = function(deployer) {
  const _name = "ZepToken";
  const _symbol = "ZEP";
  const _decimals = 18;
  
  deployer.deploy(ZepToken, _name, _symbol, _decimals);
};
