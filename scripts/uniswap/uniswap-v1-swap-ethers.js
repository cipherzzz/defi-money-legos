const { ethers } = require("ethers");
const { legos } = require("@studydefi/money-legos");
require('dotenv').config();

const NETWORK = "ropsten";
const PROJECT_ID = process.env.INFURA_ID // Replace this with your own Project ID
const provider = new ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

const wallet = new ethers.Wallet(
  process.env.DEV_PK, // Default private key for ganache-cli -d
  provider,
);

const gasLimit = process.env.GAS_LIMIT;

//Ropsten
legos.uniswap.factory.address = "0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351"
legos.erc20.eth.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
legos.erc20.dai.address = "0xaD6D458402F60fD3Bd25163575031ACDce07538D"
legos.erc20.bat.address = "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6"

const newExchangeContract = (address) =>
  new ethers.Contract(address, legos.uniswap.exchange.abi, wallet);

const newTokenContract = (address) =>
  new ethers.Contract(address, legos.erc20.abi, wallet);

const uniswapFactory = new ethers.Contract(
  legos.uniswap.factory.address,
  legos.uniswap.factory.abi,
  wallet
);

const swapOnUniswap = async (fromAddress, toAddress, fromAmountWei) => {
  // Don't swap
  if (fromAddress === toAddress) {
    return fromAmountWei;
  }

  // Min value of tokens to receive
  const minTokensReceived = 1;
  const minEthReceived = 1;

  // Random time in 2050
  const deadline = 2525644800;

  const toExchangeAddress = await uniswapFactory.getExchange(toAddress);
  const toExchangeContract = newExchangeContract(toExchangeAddress);

  // ETH -> Token
  if (fromAddress === legos.erc20.eth.address) {
    return toExchangeContract.ethToTokenSwapInput(minTokensReceived, deadline, {
      gasLimit,
      value: fromAmountWei,
    });
  }

  // ERC20 contract
  const fromTokenContract = newTokenContract(fromAddress);

  // Uniswap Exchange contract
  const fromExchangeAddress = await uniswapFactory.getExchange(fromAddress);
  const fromExchangeContract = newExchangeContract(fromExchangeAddress);

  // Need to approve transferFrom
  await fromTokenContract.approve(fromExchangeAddress, fromAmountWei);

  // Token -> ETH
  if (toAddress === legos.erc20.eth.address) {
    return fromExchangeContract.tokenToEthSwapInput(fromAmountWei, 1, deadline);
  }

  // Token -> Token
  return fromExchangeContract.tokenToTokenSwapInput(
    fromAmountWei,
    minTokensReceived,
    minEthReceived,
    deadline,
    toAddress,
    {
      gasLimit,
    }
  );
};

const swapAndLog = async (fromToken, toToken, amount) => {
  console.log(`Swapping ${amount} ${fromToken.symbol} to ${toToken.symbol}`);

  let tx = await swapOnUniswap(
    fromToken.address,
    toToken.address,
    ethers.utils.parseUnits(amount.toString(), fromToken.decimals)
  );
  
  let receipt = await tx.wait()
  console.log("tx: ", receipt.transactionHash)

  if (toToken === legos.erc20.eth) {
    const ethBalWei = await wallet.getBalance();
    console.log(
      `${toToken.symbol} balance: ${ethers.utils.formatEther(ethBalWei)}`
    );
    return;
  }

  const repBal = await newTokenContract(toToken.address).balanceOf(
    wallet.address
  );
  console.log(
    `New ${toToken.symbol} balance: ${ethers.utils.formatUnits(
      repBal,
      toToken.decimals
    )}`
  );
};

const main = async () => {
  await swapAndLog(legos.erc20.eth, legos.erc20.dai, .1);
  await swapAndLog(legos.erc20.dai, legos.erc20.bat, 10);
  await swapAndLog(legos.erc20.bat, legos.erc20.eth, 5);
};

main();