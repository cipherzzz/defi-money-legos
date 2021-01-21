import { ethers } from 'ethers';
import { legos } from '@studydefi/money-legos';

const env = require('dotenv').config();

const gasLimit = process.env.GAS_LIMIT;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);

const swapOnKyber = async (fromAddress: string, toAddress: string, fromAmountWei: any) => {
  // Don't swap
  if (fromAddress === toAddress) {
    return fromAmountWei;
  }

  const kyberNetwork = new ethers.Contract(
    legos.kyber.network.address,
    legos.kyber.network.abi,
    wallet
  );

  const { slippageRate } = await kyberNetwork.getExpectedRate(
    fromAddress,
    toAddress,
    fromAmountWei
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
    return kyberNetwork.swapTokenToEther(fromAddress, fromAmountWei, slippageRate, {
      gasLimit,
    });
  }

  // Token -> Token
  return kyberNetwork.swapTokenToToken(fromAddress, fromAmountWei, toAddress, slippageRate, {
    gasLimit,
  });
};

const swapAndLog = async (fromToken: any, toToken: any, amount: number) => {
  console.log(`Swapping ${amount} ${fromToken.symbol} to ${toToken.symbol}`);

  const tx = await swapOnKyber(
    fromToken.address,
    toToken.address,
    ethers.utils.parseUnits(amount.toString(), fromToken.decimals)
  );

  const receipt = await tx.wait();
  console.log('tx: ', receipt.transactionHash);

  if (toToken === legos.erc20.eth) {
    const ethBalWei = await wallet.getBalance();
    console.log(`${toToken.symbol} balance: ${ethers.utils.formatEther(ethBalWei)}`);
    return;
  }

  const tokenContract = new ethers.Contract(toToken.address, legos.erc20.abi, wallet);
  const repBal = await tokenContract.balanceOf(wallet.address);

  console.log(
    `New ${toToken.symbol} balance: ${ethers.utils.formatUnits(repBal, toToken.decimals)}`
  );
};

const main = async () => {
  await swapAndLog(legos.erc20.eth, legos.erc20.bat, 1);
  //await swapAndLog(legos.erc20.dai, legos.erc20.bat, 10);
  //await swapAndLog(legos.erc20.bat, legos.erc20.eth, 334050);
};

main();
