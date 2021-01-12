const KyberUniArb = artifacts.require("KyberUniArb"); // eslint-disable-line

module.exports = function (deployer) {
  deployer.deploy(KyberUniArb);
};
