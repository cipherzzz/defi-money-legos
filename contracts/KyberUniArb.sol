pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol';

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';
import './IUniswapV2.sol';

contract KyberUniArb is Ownable {
    address constant KyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address constant UniswapRouterAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    IUniswapV2 private uniswap;
    KyberNetworkProxy private kyberNetworkProxy;

    constructor() public {
        uniswap = IUniswapV2(UniswapRouterAddress);
        kyberNetworkProxy = KyberNetworkProxy(KyberNetworkProxyAddress);
    }

    enum Exchanges {KYBER, UNISWAPV2}

    function _tokenToTokenUniswapV2(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 deadline
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory calcAmounts = uniswap.getAmountsOut(amountIn, path);
        uint256[] memory amounts =
            uniswap.swapExactTokensForTokens(
                calcAmounts[0],
                calcAmounts[1],
                path,
                address(this),
                deadline
            );
        return amounts[1];
    }

    /* Kyber - so much easier  */
    function _tokenToTokenKyber(
        address source,
        address destination,
        uint256 tokenAmount
    ) internal returns (uint256) {
        uint256 minConversionRate;
        (minConversionRate, ) = kyberNetworkProxy.getExpectedRate(
            IERC20(source),
            IERC20(destination),
            tokenAmount
        );

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
        uint256 tradeAmount
    ) public payable onlyOwner {
        require(
            IERC20(fromToken).transferFrom(msg.sender, address(this), tradeAmount),
            'transfer to contract failed'
        );
        require(
            IERC20(fromToken).approve(address(kyberNetworkProxy), tradeAmount),
            'approve kyber failed'
        );
        require(
            IERC20(fromToken).approve(address(uniswap), tradeAmount),
            'approve uniswap failed.'
        );

        // Initial Trade
        uint256 firstTradeAmount;
        if (fromExchange == uint256(Exchanges.KYBER)) {
            firstTradeAmount = _tokenToTokenKyber(fromToken, toToken, tradeAmount);
        } else if (fromExchange == uint256(Exchanges.UNISWAPV2)) {
            firstTradeAmount = _tokenToTokenUniswapV2(
                fromToken,
                tradeAmount,
                toToken,
                block.timestamp
            );
        } else {
            require(false, 'No initial exchange specified');
        }

        // Secondary Trade
        uint256 secondTradeAmount;
        if (toExchange == uint256(Exchanges.KYBER)) {
            secondTradeAmount = _tokenToTokenKyber(toToken, fromToken, firstTradeAmount);
        } else if (toExchange == uint256(Exchanges.UNISWAPV2)) {
            secondTradeAmount = _tokenToTokenUniswapV2(
                toToken,
                firstTradeAmount,
                fromToken,
                block.timestamp
            );
        } else {
            require(false, 'No secondary exchange specified');
        }

        //require(secondTradeAmount > firstTradeAmount, "No Profit");

        // Transfer back to sender
        IERC20 token = IERC20(fromToken);
        token.transfer(msg.sender, secondTradeAmount);
    }
}
