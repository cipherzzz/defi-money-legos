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

const tokenAmount = '10';
executeArb(legos.erc20.dai.address, legos.erc20.bat.address, 0, 1, parseEther(tokenAmount));
