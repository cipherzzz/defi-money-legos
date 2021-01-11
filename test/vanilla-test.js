const KyberSwap = artifacts.require("KyberSwap");

let { legos } = require("@studydefi/money-legos");
let { Wallet, Contract, ethers } = require("ethers");
let { parseEther } = ethers.utils;

let kyberSwapContract;

before(async() => {
  kyberSwapContract = await KyberSwap.deployed();
  console.log("address: " + kyberSwapContract.address)
});

contract("KyberSwap test", async accounts => {
  it("should trade eth for dai", async () => {
    await kyberSwapContract.ethToToken(legos.erc20.dai.address, {value: 1000000,} )
    
    let daiContract = new ethers.Contract(legos.erc20.dai.address, legos.erc20.abi);
    const daiBal = await daiContract.balanceOf(accounts[0]);
    console.log("dai: ", daiBal)
    assert(daiBal > 0, "Expected a non-zero amount of DAI")
  });

//   it("should call a function that depends on a linked library", async () => {
//     let meta = await MetaCoin.deployed();
//     let outCoinBalance = await meta.getBalance.call(accounts[0]);
//     let metaCoinBalance = outCoinBalance.toNumber();
//     let outCoinBalanceEth = await meta.getBalanceInEth.call(accounts[0]);
//     let metaCoinEthBalance = outCoinBalanceEth.toNumber();
//     assert.equal(metaCoinEthBalance, 2 * metaCoinBalance);
//   });

//   it("should send coin correctly", async () => {
//     // Get initial balances of first and second account.
//     let account_one = accounts[0];
//     let account_two = accounts[1];

//     let amount = 10;

//     let instance = await MetaCoin.deployed();
//     let meta = instance;

//     let balance = await meta.getBalance.call(account_one);
//     let account_one_starting_balance = balance.toNumber();

//     balance = await meta.getBalance.call(account_two);
//     let account_two_starting_balance = balance.toNumber();
//     await meta.sendCoin(account_two, amount, { from: account_one });

//     balance = await meta.getBalance.call(account_one);
//     let account_one_ending_balance = balance.toNumber();

//     balance = await meta.getBalance.call(account_two);
//     let account_two_ending_balance = balance.toNumber();

//     assert.equal(
//       account_one_ending_balance,
//       account_one_starting_balance - amount,
//       "Amount wasn't correctly taken from the sender"
//     );
//     assert.equal(
//       account_two_ending_balance,
//       account_two_starting_balance + amount,
//       "Amount wasn't correctly sent to the receiver"
//     );
//   });
});