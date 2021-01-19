pragma solidity ^0.5.0;

import '@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol';


import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';

interface OrFeedInterface {
  function getExchangeRate ( string calldata fromSymbol, string calldata  toSymbol, string calldata venue, uint256 amount ) external view returns ( uint256 );
  function getTokenDecimalCount ( address tokenAddress ) external view returns ( uint256 );
  function getTokenAddress ( string calldata  symbol ) external view returns ( address );
  function getSynthBytes32 ( string calldata  symbol ) external view returns ( bytes32 );
  function getForexAddress ( string calldata symbol ) external view returns ( address );
  function arb(address  fundsReturnToAddress,  address liquidityProviderContractAddress, string[] calldata   tokens,  uint256 amount, string[] calldata  exchanges) external payable returns (bool);
}

interface IUniswapV2 {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
    
    
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract KyberUniArb is Ownable {
    address constant KyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address constant UniswapRouterAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant OrFeedAddress = 0x8316B082621CFedAB95bf4a44a1d4B64a6ffc336;
    
    IUniswapV2 private uniswap;
    KyberNetworkProxy private kyberNetworkProxy;
    OrFeedInterface private orfeed;
    
    constructor() public {
        uniswap = IUniswapV2(UniswapRouterAddress);
        kyberNetworkProxy = KyberNetworkProxy(KyberNetworkProxyAddress);
        orfeed = OrFeedInterface(OrFeedAddress);
    }

    enum Exchanges {KYBER, UNISWAPV2}

    function _tokenToTokenUniswapV2(
        address tokenIn,
        uint256 amountInMax,
        address tokenOut,
        uint256 amountOut,
        uint256 deadline
    ) internal returns (uint256) {

        require(IERC20(tokenIn).approve(address(uniswap), amountInMax), 'approve uniswap failed.');

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint[] memory amounts = uniswap.swapTokensForExactTokens(amountOut, amountInMax, path, msg.sender, deadline);
        return amounts[1];
    }

    /* Kyber - so much easier  */
    function _tokenToTokenKyber(
        address source,
        address destination,
        uint256 tokenAmount
    ) internal returns (uint256) {
        
        uint minConversionRate;
        (minConversionRate,) = kyberNetworkProxy.getExpectedRate(IERC20(source), IERC20(destination), tokenAmount);
        
        require(IERC20(source).transferFrom(msg.sender, address(this), tokenAmount));
        require(IERC20(source).approve(address(kyberNetworkProxy), 0));
        require(IERC20(source).approve(address(kyberNetworkProxy), tokenAmount));
        return
            kyberNetworkProxy.swapTokenToToken(
                IERC20(source),
                tokenAmount,
                IERC20(destination),
                minConversionRate
            );
    }

    function executeArbitrage(
        address fromToken,
        address toToken,
        uint256 fromExchange,
        uint256 toExchange,
        uint256 tradeAmount,
        uint256 slippage
    ) public payable onlyOwner {

        // Initial Trade
        uint256 firstTradeAmount;
        if (fromExchange == uint256(Exchanges.KYBER)) {
            firstTradeAmount = _tokenToTokenKyber(fromToken, toToken, tradeAmount);
        } else if (fromExchange == uint256(Exchanges.UNISWAPV2)) {
            firstTradeAmount = _tokenToTokenUniswapV2(fromToken, tradeAmount, toToken,  tradeAmount*3, block.timestamp);
        } else {
            require(false, 'No initial exchange specified');
        }

        // Secondary Trade
          uint secondTradeAmount;
          if(toExchange == uint(Exchanges.KYBER)) {
            secondTradeAmount = _tokenToTokenKyber(toToken, fromToken, firstTradeAmount);
          } else if(toExchange == uint(Exchanges.UNISWAPV2)) {
            secondTradeAmount = _tokenToTokenUniswapV2(toToken, firstTradeAmount, fromToken, tradeAmount/3, block.timestamp);
          } else {
            require(false, "No secondary exchange specified");
          }

          require(secondTradeAmount > firstTradeAmount, "No Profit");

        // Transfer back to sender
          IERC20 token = IERC20(fromToken);
          token.transfer(msg.sender, secondTradeAmount);
    }
}
