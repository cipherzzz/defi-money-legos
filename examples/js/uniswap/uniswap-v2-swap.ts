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

const chainId = ChainId.MAINNET;
const tokenAddress = legos.erc20.dai.address;

const init = async () => {
  const amountInEth = '.1';

  const dai = await Fetcher.fetchTokenData(chainId, tokenAddress);
  const weth = WETH[chainId];
  const pair = await Fetcher.fetchPairData(dai, weth);
  const route = new Route([pair], weth);
  const trade = new Trade(
    route,
    new TokenAmount(weth, parseUnits(amountInEth), 18),
    TradeType.EXACT_INPUT
  );
  console.log('dai per weth: ', route.midPrice.toSignificant(6));
  console.log('weth per dai: ', route.midPrice.invert().toSignificant(6));
  console.log('execution price: ', trade.executionPrice.toSignificant(6));
  console.log('next midprice: ', trade.nextMidPrice.toSignificant(6));

  const slippageTolerance = new Percent('20', '100'); // 1 bip = 0.001 % - so 50 bips would be .05 %
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
  const path = [weth.address, dai.address];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const value = trade.inputAmount.raw.toString();

  console.log(`Amount paid in Eth: ${amountInEth}`);
  console.log(`Minimum amount in dai: ${formatUnits(amountOutMin, 18)}`);

  let provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
  const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
  const account = signer.connect(provider);
  const address = account.address;
  const uniswap = new ethers.Contract(
    process.env.UNISWAPV2_ROUTER_ADDRESS,
    [
      'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    ],
    account
  );

  const tx = await uniswap.swapExactETHForTokens(amountOutMin, path, address, deadline, {
    value: value,
    gasLimit: process.env.GAS_LIMIT,
    gasPrice: 20e9,
  });
  console.log(`Tx Hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`Tx was processed in block: ${receipt.blockNumber}`);
};

init();
