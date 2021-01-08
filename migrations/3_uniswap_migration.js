const UniswapV1 = artifacts.require("UniswapV1");

module.exports = function (deployer) {
  deployer.deploy(UniswapV1);
};
