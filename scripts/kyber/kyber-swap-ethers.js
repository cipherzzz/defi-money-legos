const { ethers } = require("ethers");
const erc20 = require("@studydefi/money-legos/erc20");
const kyber = require("@studydefi/money-legos/kyber");
const env = require('dotenv').config().parsed;

const NETWORK = "ropsten";
const PROJECT_ID = env.INFURA_ID // Replace this with your own Project ID
const provider = new ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

const wallet = new ethers.Wallet(
  env.DEV_PK, // Default private key for ganache-cli -d
  provider,
);

const gasLimit = process.env.GAS_LIMIT;

//ropsten
kyber.network.address = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755"
erc20.eth.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
erc20.dai.address = "0xaD6D458402F60fD3Bd25163575031ACDce07538D"
erc20.bat.address = "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6"

const swapOnKyber = async (fromAddress, toAddress, fromAmountWei) => {
  // Don't swap
  if (fromAddress === toAddress) {
    return fromAmountWei;
  }
  
  const kyberNetwork = new ethers.Contract(
    kyber.network.address,
    kyber.network.abi,
    wallet,
    provider
  );
  
  const {
      slippageRate,
    } = await kyberNetwork.getExpectedRate(
      fromAddress,
      toAddress,
      fromAmountWei,
    );

  // ERC20 contract
  const fromTokenContract = new ethers.Contract(fromAddress, erc20.abi, wallet);

  // ETH -> Token
  if (fromAddress === erc20.eth.address) {
    return kyberNetwork.swapEtherToToken(toAddress, slippageRate, {
      value: fromAmountWei,
    });
  }

  // Need to approve transferFrom
  await fromTokenContract.approve(kyberNetwork.address, fromAmountWei);

  // Token -> ETH
  if (toAddress === erc20.eth.address) {
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

  if (toToken === erc20.eth) {
    const ethBalWei = await wallet.getBalance();
    console.log(
      `${toToken.symbol} balance: ${ethers.utils.formatEther(ethBalWei)}`,
    );
    return;
  }
  
  
  let tokenContract = new ethers.Contract(toToken.address, erc20.abi, wallet);
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
  /*note that I can only do one at a time right now - Error: replacement fee too low*/
  await swapAndLog(erc20.eth, erc20.dai, .01);
  await swapAndLog(erc20.dai, erc20.bat, 50);
  await swapAndLog(erc20.bat, erc20.eth, 50);
};

main();