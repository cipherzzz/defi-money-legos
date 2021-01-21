const UniswapV1 = artifacts.require("UniswapV1"); // eslint-disable-line
const UniswapV2 = artifacts.require("UniswapV2"); // eslint-disable-line

require('dotenv').config();

module.exports = function (deployer) {
  deployer.deploy(UniswapV1);
  deployer.deploy(UniswapV2, process.env.UNISWAPV2_ROUTER_ADDRESS);
};
