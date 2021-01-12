import { ethers } from 'ethers';
const { legos } = require('@studydefi/money-legos');
const { parseEther, parseUnits } = ethers.utils;

require('dotenv').config();

const KyberUniArbInterface = require('../../build/contracts/KyberUniArb.json');

const gasLimit = process.env.GAS_LIMIT;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);

const arbContract = new ethers.Contract(
  KyberUniArbInterface.networks[process.env.NETWORK_ID].address,
  KyberUniArbInterface.abi,
  wallet
);

async function executeArb(
  fromToken: string,
  toToken: string,
  fromExchange: number,
  toExchange: number,
  tokenAmount: any
) {
  const tx = await arbContract.executeArbitrage(
    fromToken,
    toToken,
    fromExchange,
    toExchange,
    parseEther(tokenAmount),
    { gasLimit }
  );
  const receipt = await tx.wait();
  console.log('Arb Tx Hash: ', receipt.transactionHash);
}

// ETH
// Kovan - 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

// DIE
// Kovan - v2 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD (Aave and Uniswap v1)
//         v1 0xC4375B7De8af5a38a93548eb8453a498222C4fF2 (Kyber)
// Ropsten - 0xaD6D458402F60fD3Bd25163575031ACDce07538D
// In our example, we will be using the v1 as that is the dai token that kovan uses on its testnet
// It is worth saying that a lot of the defi products have their own token that they use and they are generally not interchangeable ironically

const kyberNetworkProxy = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755';
const uniswapFactory = '0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351';
const daiAddress = '0xaD6D458402F60fD3Bd25163575031ACDce07538D';
const batAddress = '0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6';
const tokenAmount = '10';
executeArb(legos.erc20.dai.address, legos.erc20.bat.address, 0, 1, tokenAmount);
