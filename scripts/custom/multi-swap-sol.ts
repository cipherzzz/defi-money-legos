import { ethers } from "ethers";
const { parseEther, parseUnits } = ethers.utils;

require('dotenv').config();

const KyberSwapInterface = require('../../build/contracts/KyberSwap.json');
const UniswapV1Interface  = require('../../build/contracts/UniswapV1.json');

const NETWORK = process.env.NETWORK;
const PROJECT_ID = process.env.INFURA_ID // Replace this with your own Project ID
const gasLimit = process.env.GAS_LIMIT;
const provider = ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

const wallet = new ethers.Wallet(
  process.env.DEV_PK, // Default private key for ganache-cli -d
  provider,
);


const kyberSwap = new ethers.Contract(KyberSwapInterface.networks[3].address, KyberSwapInterface.abi, wallet);
async function swapEtherForTokenOnKyber (destinationToken, sourceTokenAmount) {

    let tx = await kyberSwap.ethToToken(destinationToken, {value: parseEther(sourceTokenAmount),} )
    let receipt = await tx.wait();
    console.log("Kyber Tx Hash: ", receipt.transactionHash);
    
}



const uniswapV1 = new ethers.Contract(UniswapV1Interface.networks[3].address, UniswapV1Interface.abi, wallet);
async function swapEtherForTokenOnUniswapV1 (destinationToken, sourceTokenAmount) {

    let tx = await uniswapV1.ethToToken(destinationToken, {value: parseEther(sourceTokenAmount), gasLimit} )
    let receipt = await tx.wait();
    console.log("UniswapV1 Tx Hash: ", receipt.transactionHash);
    
}


// ETH
// Kovan - 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

// DIE
// Kovan - v2 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD (Aave and Uniswap v1)
//         v1 0xC4375B7De8af5a38a93548eb8453a498222C4fF2 (Kyber)
//Ropsten - 0xaD6D458402F60fD3Bd25163575031ACDce07538D
// In our example, we will be using the v1 as that is the dai token that kovan uses on its testnet
// It is worth saying that a lot of the defi products have their own token that they use and they are generally not interchangeable ironically

const daiAddress = "0xaD6D458402F60fD3Bd25163575031ACDce07538D"
const tokenAmount = ".1"
swapEtherForTokenOnKyber(daiAddress, tokenAmount)
//swapEtherForTokenOnUniswapV1(daiAddress, tokenAmount)