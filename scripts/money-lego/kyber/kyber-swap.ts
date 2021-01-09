import { ethers } from 'ethers';
import { legos } from '@studydefi/money-legos';

const env = require('dotenv').config();

const NETWORK = process.env.NETWORK;
const PROJECT_ID = process.env.INFURA_ID // Replace this with your own Project ID
const gasLimit = process.env.GAS_LIMIT;
const provider = ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

const wallet = new ethers.Wallet(
  process.env.DEV_PK, // Default private key for ganache-cli -d
  provider,
);

//ropsten
legos.kyber.network.address = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755"
legos.erc20.eth.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
legos.erc20.dai.address = "0xaD6D458402F60fD3Bd25163575031ACDce07538D"
legos.erc20.bat.address = "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6"

const swapOnKyber = async (fromAddress, toAddress, fromAmountWei) => {
  // Don't swap
  if (fromAddress === toAddress) {
    return fromAmountWei;
  }
  
  const kyberNetwork = new ethers.Contract(
    legos.kyber.network.address,
    legos.kyber.network.abi,
    wallet
  );
  
  const {
      slippageRate,
    } = await kyberNetwork.getExpectedRate(
      fromAddress,
      toAddress,
      fromAmountWei,
    );

  // ERC20 contract
  const fromTokenContract = new ethers.Contract(fromAddress, legos.erc20.abi, wallet);

  // ETH -> Token
  if (fromAddress === legos.erc20.eth.address) {
    return kyberNetwork.swapEtherToToken(toAddress, slippageRate, {
      value: fromAmountWei,
    });
  }

  // Need to approve transferFrom
  await fromTokenContract.approve(kyberNetwork.address, fromAmountWei);

  // Token -> ETH
  if (toAddress === legos.erc20.eth.address) {
    return kyberNetwork.swapTokenToEther(
      fromAddress,
      fromAmountWei,
      slippageRate,
      {
        gasLimit,
      },
    );
  }

  // Token -> Token
  return kyberNetwork.swapTokenToToken(
    fromAddress,
    fromAmountWei,
    toAddress,
    slippageRate,
    {
      gasLimit,
    },
  );
};

const swapAndLog = async (fromToken, toToken, amount) => {
  console.log(`Swapping ${amount} ${fromToken.symbol} to ${toToken.symbol}`);

  let tx = await swapOnKyber(
    fromToken.address,
    toToken.address,
    ethers.utils.parseUnits(amount.toString(), fromToken.decimals),
  );
  
  let receipt = await tx.wait()
  console.log("tx: ", receipt.transactionHash)

  if (toToken === legos.erc20.eth) {
    const ethBalWei = await wallet.getBalance();
    console.log(
      `${toToken.symbol} balance: ${ethers.utils.formatEther(ethBalWei)}`,
    );
    return;
  }
  
  
  let tokenContract = new ethers.Contract(toToken.address, legos.erc20.abi, wallet);
  const repBal = await tokenContract.balanceOf(
    wallet.address,
  );
 
  console.log(
    `New ${toToken.symbol} balance: ${ethers.utils.formatUnits(
      repBal,
      toToken.decimals,
    )}`,
  );
};

const main = async () => {
  //await swapAndLog(legos.erc20.eth, legos.erc20.dai, .01);
  // await swapAndLog(legos.erc20.dai, legos.erc20.bat, 50);
   await swapAndLog(legos.erc20.bat, legos.erc20.eth, 1500);
};

main();