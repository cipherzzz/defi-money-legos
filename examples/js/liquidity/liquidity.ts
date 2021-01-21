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
      'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
    ],
    account
  );

  kyber = new ethers.Contract(legos.kyber.network.address, legos.kyber.network.abi, account);
}

async function addLiquidityUniswapV2(tokenA, tokenB, desiredAmtTokenA) {
  let tokenAContract = new ethers.Contract(tokenA.address, tokenA.abi, account);
  let tokenBContract = new ethers.Contract(tokenB.address, tokenB.abi, account);

  const desiredAmtA = parseUnits(desiredAmtTokenA, tokenA.decimals);

  const path = [tokenA.address, tokenB.address];
  const amounts = await uniswap.getAmountsOut(desiredAmtA, path);
  const desiredAmtB = amounts[1];

  // *** very important ****
  await tokenAContract.approve(uniswap.address, desiredAmtA);
  await tokenBContract.approve(uniswap.address, desiredAmtB);

  const minAmtA = desiredAmtA.mul(parseUnits('9', 0)).div(parseUnits('10', 0));
  const minAmtB = desiredAmtB.mul(parseUnits('9', 0)).div(parseUnits('10', 0));

  const tx = await uniswap.addLiquidity(
    tokenA.address,
    tokenB.address,
    desiredAmtA,
    desiredAmtB,
    minAmtA,
    minAmtB,
    address,
    deadline,
    {
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: 20e9,
    }
  );
  const receipt = await tx.wait();

  let dai_bat_liquidity_address = '0x6929abD7931D0243777d3CD147fE863646A752ba';
  let liquidityToken = new ethers.Contract(dai_bat_liquidity_address, legos.erc20.abi, account);
  const liquidityBalance = await liquidityToken.balanceOf(address);
  console.log('Added Liquidity');
  console.log(` Added ${tokenA.address} In:, ${formatUnits(desiredAmtA, 18)}`);
  console.log(` Added ${tokenB.address} In:, ${formatUnits(desiredAmtB, 18)}`);
  console.log(` Received ${dai_bat_liquidity_address} In:, ${formatUnits(liquidityBalance, 18)}`);
}

init();
addLiquidityUniswapV2(legos.erc20.dai, legos.erc20.bat, '100');
