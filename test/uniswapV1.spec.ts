import { expect, uniswapV1, legos, parseUnits, wallet, DAI, GAS_LIMIT } from './setup';

const gasLimit = process.env.GAS_LIMIT;
const daiAmountIn = parseUnits('10', legos.erc20.dai.decimals);

describe('UniswapV1', async function () {
  it('We should have sufficient DAI balances', async function () {
    let amtBefore = await DAI.balanceOf(wallet.address);
    expect(Number(amtBefore)).to.gt(Number(daiAmountIn.mul(parseUnits('10', 0))));
  });

  it('Should swap Eth for Dai', async function () {
    //dai balance before
    const daiBalanceBefore = await DAI.balanceOf(wallet.address);

    let tx = await uniswapV1.ethToToken(legos.erc20.dai.address, {
      value: parseUnits('.1', legos.erc20.decimals),
      gasLimit: GAS_LIMIT,
    });

    const daiBalanceAfter = await DAI.balanceOf(wallet.address);
    expect(Number(daiBalanceAfter)).to.be.gt(Number(daiBalanceBefore));
  });
});
