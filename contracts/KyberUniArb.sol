pragma solidity ^0.5.0;

import '@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol';
import '@studydefi/money-legos/uniswap/contracts/IUniswapExchange.sol';
import '@studydefi/money-legos/uniswap/contracts/IUniswapFactory.sol';

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';

contract KyberUniArb is Ownable {
    address constant KyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    IUniswapFactory private uniswapFactory;
    KyberNetworkProxy private kyberNetworkProxy;

    enum Exchanges {KYBER, UNISWAPV1}

    /*Uniswap Begin */
    function _getUniswapExchange(address tokenAddress) internal view returns (address) {
        return uniswapFactory.getExchange(tokenAddress);
    }

    function _ethToToken(address tokenAddress, uint256 ethAmount) internal returns (uint256) {
        return _ethToToken(tokenAddress, ethAmount, uint256(1));
    }

    function _ethToToken(
        address tokenAddress,
        uint256 ethAmount,
        uint256 minTokenAmount
    ) internal returns (uint256) {
        return
            IUniswapExchange(_getUniswapExchange(tokenAddress)).ethToTokenSwapInput.value(
                ethAmount
            )(minTokenAmount, uint256(now + 60));
    }

    function _tokenToEth(address tokenAddress, uint256 tokenAmount) internal returns (uint256) {
        return _tokenToEth(tokenAddress, tokenAmount, uint256(1));
    }

    function _tokenToEth(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minEthAmount
    ) internal returns (uint256) {
        address exchange = _getUniswapExchange(tokenAddress);
        IERC20(tokenAddress).approve(exchange, tokenAmount);
        return
            IUniswapExchange(exchange).tokenToEthSwapInput(
                tokenAmount,
                minEthAmount,
                uint256(now + 60)
            );
    }

    function _tokenToToken(
        address from,
        address to,
        uint256 tokenInAmount,
        uint256 minTokenOut
    ) internal returns (uint256) {
        uint256 ethAmount = _tokenToEth(from, tokenInAmount);
        return _ethToToken(to, ethAmount, minTokenOut);
    }

    function _tokenToTokenUniswapV1(
        address from,
        address to,
        uint256 tokenAmount
    ) internal returns (uint256) {
        return _tokenToToken(from, to, tokenAmount, uint256(1));
    }

    /* Uniswap end  */

    /* Kyber - so much easier  */
    function _tokenToTokenKyber(
        address source,
        address destination,
        uint256 tokenAmount
    ) internal returns (uint256) {
        IERC20(source).approve(address(kyberNetworkProxy), tokenAmount);
        return
            kyberNetworkProxy.swapTokenToToken(
                IERC20(source),
                tokenAmount,
                IERC20(destination),
                uint256(1)
            );
    }

    function executeArbitrage(
        address fromToken,
        address toToken,
        uint256 fromExchange,
        uint256 toExchange,
        uint256 tradeAmount
    ) public payable onlyOwner {
        // Instantiate UniswapFactory
        uniswapFactory = IUniswapFactory(UniswapFactoryAddress);

        // Instantiate KyberNetworkProxy
        kyberNetworkProxy = KyberNetworkProxy(KyberNetworkProxyAddress);

        // Initial Trade
        uint256 firstTradeAmount;
        if (fromExchange == uint256(Exchanges.KYBER)) {
            firstTradeAmount = _tokenToTokenKyber(fromToken, toToken, tradeAmount);
        } else if (fromExchange == uint256(Exchanges.UNISWAPV1)) {
            firstTradeAmount = _tokenToTokenUniswapV1(fromToken, toToken, tradeAmount);
        } else {
            require(false, 'No initial exchange specified');
        }

        // Secondary Trade
        //   uint secondTradeAmount;
        //   if(exchanges[1] == uint(Exchanges.KYBER)) {
        //     secondTradeAmount = _tokenToTokenKyber(pairs[1], pairs[0], firstTradeAmount);
        //   } else if(exchanges[1] == uint(Exchanges.UNISWAPV1)) {
        //     secondTradeAmount = _tokenToTokenUniswapV1(pairs[1], pairs[0], firstTradeAmount);
        //   } else {
        //     require(false, "No secondary exchange specified");
        //   }

        //   require(secondTradeAmount > firstTradeAmount, "No Profit");

        //   // Transfer back to sender
        //   IERC20 token = IERC20(pairs[0]);
        //   token.transfer(msg.sender, secondTradeAmount);
    }
}
