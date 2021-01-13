describe('KyberSwap', async function () {
  let { legos } = require('@studydefi/money-legos');
  let { Contract, ethers, B } = require('ethers');
  let { parseEther, formatUnits, parseUnits, BigNumber } = ethers.utils;

  const assert = require('assert').strict;

  require('dotenv').config();

  const KyberSwapInterface = require('../build/contracts/KyberSwap.json');

  const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);
  const gasLimit = process.env.GAS_LIMIT;

  it('swaps Eth for Dai', async function () {
    const address = KyberSwapInterface.networks[process.env.NETWORK_ID].address;
    const abi = KyberSwapInterface.abi;
    let contract = new Contract(address, abi, wallet);

    //dai balance before
    const dai = new Contract(legos.erc20.dai.address, legos.erc20.abi, wallet);
    const daiBalanceBefore = await dai.balanceOf(wallet.address);

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
