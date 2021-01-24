import { expect, kyber, legos, parseUnits, formatUnits, Contract, wallet, DAI, BAT, BigNumber } from './setup';

const dai_bat_liquidity_address = '0x6929abD7931D0243777d3CD147fE863646A752ba';
let liquidityToken = new Contract(dai_bat_liquidity_address, legos.erc20.abi, wallet);

describe('Liquidity', async function () {
  const daiAmountIn = parseUnits('10', legos.erc20.dai.decimals);
  let batAmountIn; // Will be set for us
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const uniswap = new Contract(
    process.env.UNISWAPV2_ROUTER_ADDRESS,
    [
      'function swapTokensForExactTokens(uint amountOut, uint amountIn, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
      'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
      'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
    ],
    wallet
  );

  it('We should have sufficient DAI balances', async function () {
    let amtBefore = await DAI.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(daiAmountIn.mul(parseUnits('10', 0))));
  });

  it('We should have sufficient BAT balances', async function () {
    let amtBefore = await BAT.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(daiAmountIn.mul(parseUnits('40', 0))));
  });

  it('Should provide liquidity on UniswapV2 to DIE/BAT pool', async function () {
    const daiBalanceBefore = await DAI.balanceOf(wallet.address);
    const batBalanceBefore = await BAT.balanceOf(wallet.address);
    const liquidityBalanceBefore = await liquidityToken.balanceOf(wallet.address);

    await addLiquidityUniswapV2(DAI, BAT, daiAmountIn, uniswap, deadline, wallet);

    const daiBalanceAfter = await DAI.balanceOf(wallet.address);
    const batBalanceAfter = await BAT.balanceOf(wallet.address);
    const liquidityBalanceAfter = await liquidityToken.balanceOf(wallet.address);

    expect(Number(daiBalanceBefore)).to.gt(Number(daiBalanceAfter));
    expect(Number(batBalanceBefore)).to.gt(Number(batBalanceAfter));
    expect(Number(liquidityBalanceAfter)).to.gt(Number(liquidityBalanceBefore));
  });

  it('Should remove liquidity on the UniswapV2 DIE/BAT pool and return DAI and BAT', async function () {
    const daiBalanceBefore = await DAI.balanceOf(wallet.address);
    const batBalanceBefore = await BAT.balanceOf(wallet.address);
    const liquidityBalanceBefore = await liquidityToken.balanceOf(wallet.address);

    await removeLiquidityUniswapV2(DAI, BAT, liquidityBalanceBefore, uniswap, deadline, wallet);

    const daiBalanceAfter = await DAI.balanceOf(wallet.address);
    const batBalanceAfter = await BAT.balanceOf(wallet.address);
    const liquidityBalanceAfter = await liquidityToken.balanceOf(wallet.address);

    expect(Number(daiBalanceAfter)).to.gt(Number(daiBalanceBefore));
    expect(Number(batBalanceAfter)).to.gt(Number(batBalanceBefore));
    expect(Number(liquidityBalanceBefore)).to.gt(Number(liquidityBalanceAfter));
  });
});

async function addLiquidityUniswapV2(tokenA, tokenB, desiredAmtTokenA, uniswap, deadline, wallet) {
  const path = [tokenA.address, tokenB.address];
  const amounts = await uniswap.getAmountsOut(desiredAmtTokenA, path);
  const desiredAmtB = amounts[1];

  // *** very important ****
  await tokenA.approve(uniswap.address, desiredAmtTokenA);
  await tokenB.approve(uniswap.address, desiredAmtB);

  const minAmtA = desiredAmtTokenA.mul(parseUnits('9', 0)).div(parseUnits('10', 0));
  const minAmtB = desiredAmtB.mul(parseUnits('9', 0)).div(parseUnits('10', 0));

  const tx = await uniswap.addLiquidity(
    tokenA.address,
    tokenB.address,
    desiredAmtTokenA,
    desiredAmtB,
    minAmtA,
    minAmtB,
    wallet.address,
    deadline,
    {
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: 20e9,
    }
  );
  const receipt = await tx.wait();
}

async function removeLiquidityUniswapV2(
  tokenA,
  tokenB,
  liquidityAmount,
  uniswap,
  deadline,
  wallet
) {

  // *** very important ****
  await liquidityToken.approve(uniswap.address, liquidityAmount);

  const tx = await uniswap.removeLiquidity(
    tokenA.address,
    tokenB.address,
    liquidityAmount,
    BigNumber.from(0), // don't know how to calculate this
    BigNumber.from(0), // don't know how to calculate this
    wallet.address,
    deadline,
    {
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: 20e9,
    }
  );
  const receipt = await tx.wait();
}
