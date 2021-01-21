const { legos } = require('@studydefi/money-legos');
const { expect } = require('chai');
const { Contract, ethers } = require('ethers');
const { parseEther, formatUnits, parseUnits, BigNumber } = ethers.utils;

require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);
const gasLimit = process.env.GAS_LIMIT;

const uniswapV1Artifact = require('../build/contracts/UniswapV1.json');
const uniswapV1 = new Contract(
  uniswapV1Artifact.networks[process.env.NETWORK_ID].address,
  uniswapV1Artifact.abi,
  wallet
);

const uniswapV2Artifact = require('../build/contracts/UniswapV2.json');
const uniswapV2 = new Contract(
  uniswapV2Artifact.networks[process.env.NETWORK_ID].address,
  uniswapV2Artifact.abi,
  wallet
);

const kyberArtifact = require('../build/contracts/KyberSwap.json');
let kyber = new Contract(
  kyberArtifact.networks[process.env.NETWORK_ID].address,
  kyberArtifact.abi,
  wallet
);

const DAI = new Contract(legos.erc20.dai.address, legos.erc20.dai.abi, wallet);
const BAT = new Contract(legos.erc20.bat.address, legos.erc20.bat.abi, wallet);

const GAS_LIMIT = process.env.GAS_LIMIT;

export {
  wallet,
  uniswapV1,
  uniswapV2,
  kyber,
  parseEther,
  formatUnits,
  parseUnits,
  BigNumber,
  Contract,
  ethers,
  expect,
  legos,
  DAI,
  BAT,
  GAS_LIMIT,
};
