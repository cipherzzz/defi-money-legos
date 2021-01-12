const UniswapV1 = artifacts.require("UniswapV1"); // eslint-disable-line

module.exports = function (deployer) {
  deployer.deploy(UniswapV1);
};
