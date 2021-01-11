import { ethers } from "ethers";
import { legos } from '@studydefi/money-legos';
const { parseEther, parseUnits } = ethers.utils;

require('dotenv').config();

const KyberSwapInterface = require('../../build/contracts/KyberSwap.json');
const UniswapV1Interface  = require('../../build/contracts/UniswapV1.json');

const gasLimit = process.env.GAS_LIMIT;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const wallet = ethers.Wallet.fromMnemonic( process.env.MNEMONIC).connect(provider);

const kyberSwap = new ethers.Contract(KyberSwapInterface.networks[process.env.NETWORK_ID].address, KyberSwapInterface.abi, wallet);
async function swapEtherForTokenOnKyber (destinationToken, sourceTokenAmount) {

    let tx = await kyberSwap.ethToToken(destinationToken, {value: parseEther(sourceTokenAmount), gasLimit} )
    let receipt = await tx.wait();
    console.log("Kyber Tx Hash: ", receipt.transactionHash);
    
}



const uniswapV1 = new ethers.Contract(UniswapV1Interface.networks[process.env.NETWORK_ID].address, UniswapV1Interface.abi, wallet);
async function swapEtherForTokenOnUniswapV1 (destinationToken, sourceTokenAmount) {

    let tx = await uniswapV1.ethToToken(destinationToken, {value: parseEther(sourceTokenAmount), gasLimit} )
    let receipt = await tx.wait();
    console.log("UniswapV1 Tx Hash: ", receipt.transactionHash);
    
}

const main = async () => {
  await swapEtherForTokenOnKyber(legos.erc20.dai.address, ".1");
  await swapEtherForTokenOnUniswapV1(legos.erc20.bat.address, ".1")
};

main();