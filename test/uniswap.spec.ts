let { legos } = require('@studydefi/money-legos');
let { Contract, ethers } = require('ethers');
let { parseEther, formatUnits, parseUnits, formatEther } = ethers.utils;

const assert = require('assert').strict;

require('dotenv').config();

const UniswapV1Interface = require('../build/contracts/UniswapV1.json');

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);
const gasLimit = process.env.GAS_LIMIT;

describe('UniswapV1', async function () {
  it('swaps Eth for Dai', async function () {
    const address = UniswapV1Interface.networks[process.env.NETWORK_ID].address;
    const abi = UniswapV1Interface.abi;
    let contract = new Contract(address, abi, wallet);

    //dai balance before
    const dai = new Contract(legos.erc20.dai.address, legos.erc20.abi, wallet);
    const daiBalanceBefore = await dai.balanceOf(wallet.address);

    let ether = await wallet.getBalance();
    let tx = await contract.ethToToken(legos.erc20.dai.address, {
      value: parseEther('.1'),
      gasLimit,
    });

    const daiBalanceAfter = await dai.balanceOf(wallet.address);
    assert(
      daiBalanceAfter.gt(daiBalanceBefore),
      'Expected die balance after transfer to be greater'
    );
  });
});
