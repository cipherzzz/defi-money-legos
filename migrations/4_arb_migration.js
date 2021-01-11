const KyberUniArb = artifacts.require("KyberUniArb");

module.exports = function (deployer) {
  deployer.deploy(KyberUniArb);
};
