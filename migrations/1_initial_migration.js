const Migrations = artifacts.require("Migrations"); // eslint-disable-line

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
