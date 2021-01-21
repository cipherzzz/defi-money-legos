import {
  expect,
  legos,
  parseUnits,
  formatUnits,
  Contract,
  wallet,
  DAI,
  BAT,
  GAS_LIMIT,
} from './setup';

describe('Arbitrage', async function () {
  const daiAmountIn = parseUnits('10', legos.erc20.dai.decimals);
  const batAmountIn = parseUnits('100', legos.erc20.bat.decimals);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const uniswap = new Contract(
    process.env.UNISWAPV2_ROUTER_ADDRESS,
    [
      'function swapTokensForExactTokens(uint amountOut, uint amountIn, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
      'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
    ],
    wallet
  );
  const kyber = new Contract(legos.kyber.network.address, legos.kyber.network.abi, wallet);

  it('We should have sufficient DAI balances', async function () {
    let amtBefore = await DAI.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(daiAmountIn.mul(parseUnits('10', 0))));
  });

  it('We should have sufficient BAT balances', async function () {
    let amtBefore = await BAT.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(batAmountIn.mul(parseUnits('10', 0))));
  });

  it('Should arbitrage between UniswapV2 and Kyber with DAI => BAT => DAI', async function () {
    const amountOutUni = await swapTokensOnUniswapV2(
      DAI,
      daiAmountIn,
      BAT,
      uniswap,
      wallet,
      deadline
    );
    const amountOutKyber = await swapTokensOnKyber(BAT, amountOutUni, DAI, kyber, wallet);
    expect(amountOutKyber).to.exist; // Can't really test arbitrage performance
  });

  it('Should arbitrage between Kyber and UniswapV2 with BAT => DAI => BAT', async function () {
    const amountOutKyber = await swapTokensOnKyber(BAT, batAmountIn, DAI, kyber, wallet);
    const amountOutUni = await swapTokensOnUniswapV2(
      BAT,
      amountOutKyber,
      DAI,
      uniswap,
      wallet,
      deadline
    );

    expect(amountOutUni).to.exist; // Can't really test arbitrage performance
  });
});

async function swapTokensOnKyber(tokenIn, amountIn, tokenOut, kyber, wallet) {
  let amtBefore = await tokenOut.balanceOf(wallet.address);

  const { slippageRate } = await kyber.getExpectedRate(tokenIn.address, tokenOut.address, amountIn);

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

  let amtAfter = await tokenOut.balanceOf(wallet.address);
  let amountOut = amtAfter.sub(amtBefore);
  return amountOut;
}

async function swapTokensOnUniswapV2(tokenIn, amountIn, tokenOut, uniswap, wallet, deadline) {
  let amtBefore = await tokenOut.balanceOf(wallet.address);

  // *** very important ****
  await tokenIn.approve(uniswap.address, amountIn);

  const newPath = [tokenIn.address, tokenOut.address];
  const amounts = await uniswap.getAmountsOut(amountIn, newPath);

  const tokenOutAmount = amounts[1];

  const tx = await uniswap.swapTokensForExactTokens(
    amounts[1],
    amounts[0],
    newPath,
    wallet.address,
    deadline,
    {
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: 20e9,
    }
  );
  const receipt = await tx.wait();

  let amtAfter = await tokenOut.balanceOf(wallet.address);
  let amountOut = amtAfter.sub(amtBefore);
  return amountOut;
}
