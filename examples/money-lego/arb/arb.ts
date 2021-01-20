const { legos } = require('@studydefi/money-legos');
const {
  ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
} = require('@uniswap/sdk');
const ethers = require('ethers');
const { parseUnits, formatUnits } = ethers.utils;
require('dotenv').config();

let provider, signer, account, address, deadline, uniswap, kyber, BAT, DAI;

async function swapTokensOnKyber(tokenIn, amountIn, tokenOut) {
  let amtBefore = await tokenOut.balanceOf(account.address);

  const { slippageRate } = await kyber.getExpectedRate(tokenIn.address, tokenOut.address, amountIn);

  console.log('kyber bat/die: ', formatUnits(slippageRate, 18));

  // Need to approve transferFrom
  await tokenIn.approve(kyber.address, amountIn);

  // Token -> Token
  const tx = await kyber.swapTokenToToken(
    tokenIn.address,
    amountIn,
    tokenOut.address,
    slippageRate,
    {
      gasLimit: process.env.GAS_LIMIT,
    }
  );
  const receipt = await tx.wait();

  let amtAfter = await tokenOut.balanceOf(account.address);
  let amountOut = amtAfter.sub(amtBefore);
  return amountOut;
}

async function swapTokensOnUniswapV2(tokenIn, amountIn, tokenOut) {
  let amtBefore = await tokenOut.balanceOf(account.address);

  // *** very important ****
  await tokenIn.approve(uniswap.address, amountIn);

  const newPath = [tokenIn.address, tokenOut.address];
  const amounts = await uniswap.getAmountsOut(amountIn, newPath);

  const tokenOutAmount = amounts[1];
  console.log('uniswap die/bat: ', formatUnits(amounts[1], 18));

  const tx = await uniswap.swapTokensForExactTokens(
    amounts[1],
    amounts[0],
    newPath,
    address,
    deadline,
    {
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: 20e9,
    }
  );
  const receipt = await tx.wait();

  let amtAfter = await tokenOut.balanceOf(account.address);
  let amountOut = amtAfter.sub(amtBefore);
  return amountOut;
}

async function init() {
  provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
  signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
  account = signer.connect(provider);
  address = account.address;
  deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  uniswap = new ethers.Contract(
    process.env.UNISWAPV2_ROUTER_ADDRESS,
    [
      'function swapTokensForExactTokens(uint amountOut, uint amountIn, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
    ],
    account
  );

  kyber = new ethers.Contract(legos.kyber.network.address, legos.kyber.network.abi, account);

  BAT = new ethers.Contract(legos.erc20.bat.address, legos.erc20.bat.abi, account);
  DAI = new ethers.Contract(legos.erc20.dai.address, legos.erc20.dai.abi, account);
}

async function executeArb(tokenIn, amtIn, tokenOut) {
  init();
  const amountIn = parseUnits(amtIn, 18);
  let amtBefore = await DAI.balanceOf(account.address);
  const amountOutUni = await swapTokensOnUniswapV2(DAI, amountIn, BAT);
  const amountOutKyber = await swapTokensOnKyber(BAT, amountOutUni, DAI);

  console.log(`Amount ${tokenIn.address} In:', ${formatUnits(amountIn, 18)}`);
  console.log(`Amount ${tokenIn.address} Out:', ${formatUnits(amountOutKyber, 18)}`);
}

 executeArb(legos.erc20.dai, '100', legos.erc20.bat); // The more you run this on a forked network the worse your rate will be