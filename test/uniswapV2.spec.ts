import {
  ethers,
  expect,
  uniswapV2,
  legos,
  parseUnits,
  formatUnits,
  Contract,
  wallet,
  DAI,
  BAT,
} from './setup';

const {
  ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
  GAS_LIMIT,
} = require('@uniswap/sdk');

describe('UniswapV2', async function () {
  const daiAmountIn = parseUnits('10', legos.erc20.dai.decimals);

  it('We should have sufficient DAI balances', async function () {
    let amtBefore = await DAI.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(daiAmountIn.mul(parseUnits('10', 0))));
  });

  it('Should swap Dai for Bat with custom SmartContract', async function () {
    const tokenIn = DAI;
    const tokenOut = BAT;

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    const daiBalanceBefore = await DAI.balanceOf(wallet.address);
    const batBalanceBefore = await BAT.balanceOf(wallet.address);

    // *** very important ****
    await tokenIn.approve(uniswapV2.address, daiAmountIn);

    const newPath = [tokenIn.address, tokenOut.address];
    const amounts = await uniswapV2.getAmounts(newPath, daiAmountIn);

    const tokenOutAmount = amounts[1];

    const tx = await uniswapV2.swapTokensForExactTokens(
      tokenIn.address,
      amounts[0],
      tokenOut.address,
      amounts[1],
      deadline,
      {
        gasLimit: GAS_LIMIT,
      }
    );
    const receipt = await tx.wait();

    const daiBalanceAfter = await DAI.balanceOf(wallet.address);
    const batBalanceAfter = await BAT.balanceOf(wallet.address);

    expect(Number(daiBalanceAfter)).to.eq(Number(daiBalanceBefore.sub(amounts[0])));
    expect(Number(batBalanceAfter)).to.eq(Number(batBalanceBefore.add(amounts[1])));
  });

  it('Should swap DAI for BAT with UniswapV2 SDK', async function () {
    const uniswapSDK = new ethers.Contract(
      process.env.UNISWAPV2_ROUTER_ADDRESS,
      [
        'function swapTokensForExactTokens(uint amountOut, uint amountIn, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
        'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
      ],
      wallet
    );

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const amounts = await uniswapV2.getAmounts(
      [legos.erc20.dai.address, legos.erc20.bat.address],
      daiAmountIn
    );

    const path = [legos.erc20.dai.address, legos.erc20.bat.address];

    const daiBalanceBefore = await DAI.balanceOf(wallet.address);
    const batBalanceBefore = await BAT.balanceOf(wallet.address);

    await DAI.approve(uniswapSDK.address, amounts[0]);

    const tx = await uniswapSDK.swapTokensForExactTokens(
      amounts[1],
      amounts[0],
      path,
      wallet.address,
      deadline,
      {
        gasLimit: GAS_LIMIT,
      }
    );

    const receipt = await tx.wait();
    expect(receipt.blockNumber).to.exist;

    const daiBalanceAfter = await DAI.balanceOf(wallet.address);
    const batBalanceAfter = await BAT.balanceOf(wallet.address);

    expect(Number(daiBalanceAfter)).to.eq(Number(daiBalanceBefore.sub(amounts[0])));
    expect(Number(batBalanceAfter)).to.eq(Number(batBalanceBefore.add(amounts[1])));
  });
});
