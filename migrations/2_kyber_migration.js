const KyberSwap = artifacts.require("KyberSwap"); // eslint-disable-line

module.exports = function (deployer) {
  deployer.deploy(KyberSwap);
};
