const KyberSwap = artifacts.require("KyberSwap");

module.exports = function (deployer) {
  deployer.deploy(KyberSwap);
};
