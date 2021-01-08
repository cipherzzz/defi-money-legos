const { ethers } = require("ethers");
const env = require('dotenv').config().parsed;
const { parseEther, parseUnits, bigNumberify } = ethers.utils;

const NETWORK = "ropsten";
const PROJECT_ID = env.INFURA_ID // Replace this with your own Project ID
const provider = new ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

const wallet = new ethers.Wallet(
  env.DEV_PK, // Default private key for ganache-cli -d
  provider,
);


const KyberSwapInterface = require('../../build/contracts/KyberSwap.json');
const kyberSwap = new ethers.Contract(KyberSwapInterface.networks[3].address, KyberSwapInterface.abi, wallet);

async function swapEtherForToken (destinationToken, sourceTokenAmount) {

    let tx = await kyberSwap.ethToToken(destinationToken, {value: parseEther(sourceTokenAmount)} )
    let receipt = await tx.wait();
    console.log("Tx Hash: ", receipt.transactionHash);
    
}


// ETH
// Kovan - 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

// DIE
// Kovan - v2 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD (Aave and Uniswap v1)
//         v1 0xC4375B7De8af5a38a93548eb8453a498222C4fF2 (Kyber)
//Ropsten - 0xaD6D458402F60fD3Bd25163575031ACDce07538D
// In our example, we will be using the v1 as that is the dai token that kovan uses on its testnet
// It is worth saying that a lot of the defi products have their own token that they use and they are generally not interchangeable ironically

const tokenAddress = "0xaD6D458402F60fD3Bd25163575031ACDce07538D"
const tokenAmount = ".1"
swapEtherForToken(tokenAddress, tokenAmount)