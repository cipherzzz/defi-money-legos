pragma solidity ^0.5.0;

import '@studydefi/money-legos/uniswap/contracts/IUniswapExchange.sol';
import '@studydefi/money-legos/uniswap/contracts/IUniswapFactory.sol';

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract UniswapV1 {
    // Uniswap Ropsten factory address
    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    function _getUniswapExchange(address tokenAddress) internal view returns (address) {
        return IUniswapFactory(UniswapFactoryAddress).getExchange(tokenAddress);
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

    function _tokenToToken(
        address from,
        address to,
        uint256 tokenAmount
    ) internal returns (uint256) {
        return _tokenToToken(from, to, tokenAmount, uint256(1));
    }

    function _getTokenToEthInput(address tokenAddress, uint256 tokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            IUniswapExchange(_getUniswapExchange(tokenAddress)).getTokenToEthInputPrice(
                tokenAmount
            );
    }

    function _getEthToTokenInput(address tokenAddress, uint256 ethAmount)
        internal
        view
        returns (uint256)
    {
        return
            IUniswapExchange(_getUniswapExchange(tokenAddress)).getEthToTokenInputPrice(ethAmount);
    }

    function _getTokenToEthOutput(address tokenAddress, uint256 ethAmount)
        internal
        view
        returns (uint256)
    {
        return
            IUniswapExchange(_getUniswapExchange(tokenAddress)).getTokenToEthOutputPrice(ethAmount);
    }

    function _getEthToTokenOutput(address tokenAddress, uint256 tokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            IUniswapExchange(_getUniswapExchange(tokenAddress)).getEthToTokenOutputPrice(
                tokenAmount
            );
    }

    function _getTokenToTokenInput(
        address from,
        address to,
        uint256 fromAmount
    ) internal view returns (uint256) {
        uint256 ethAmount = _getTokenToEthInput(from, fromAmount);
        return _getEthToTokenInput(to, ethAmount);
    }

    function ethToToken(address tokenAddress) public payable {
        IERC20 token = IERC20(tokenAddress);
        uint256 tokensAmount = _ethToToken(tokenAddress, msg.value);
        token.transfer(msg.sender, tokensAmount);
    }
    
    function tokenToToken(address fromAddress, address toAddress, uint256 fromAmount) public payable {
        IERC20 toToken = IERC20(toAddress);
        uint256 tokensAmount = _tokenToToken(fromAddress, toAddress, fromAmount);
        toToken.transfer(msg.sender, tokensAmount);
    }
}
