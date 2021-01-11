

let { legos } = require("@studydefi/money-legos");
let { Contract, ethers } = require("ethers");
let { parseEther } = ethers.utils;

const assert = require('assert').strict;

require('dotenv').config();

const KyberSwapInterface = require('../build/contracts/KyberSwap.json');

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const wallet = ethers.Wallet.fromMnemonic( process.env.MNEMONIC).connect(provider);
const gasLimit = process.env.GAS_LIMIT;
  
describe('KyberSwap', async function() {
    it('swaps Eth for Dai', async function() {
        const address = KyberSwapInterface.networks[process.env.NETWORK_ID].address;
        const abi = KyberSwapInterface.abi;
        let contract = new Contract(address, abi, wallet);
        let tx = await contract.ethToToken(legos.erc20.dai.address, {value: parseEther("10"), gasLimit});
        // let receipt = tx.wait();
        // let balance = await wallet.getBalance();
        // assert(balance > 0, balance);
    });
});  