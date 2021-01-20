// ../tests/kyber.test.sol

pragma solidity ^0.5.0;

import '@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract KyberSwap {
    // KyberNetwork Mainnet factory address
    address constant KyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;

    function _ethToToken(address tokenAddress, uint256 ethAmount) internal returns (uint256) {
        return _ethToToken(tokenAddress, ethAmount, uint256(1));
    }

    function _ethToToken(
        address tokenAddress,
        uint256 ethAmount,
        uint256 minConversionRate
    ) internal returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return
            KyberNetworkProxy(KyberNetworkProxyAddress).swapEtherToToken.value(ethAmount)(
                token,
                minConversionRate
            );
    }

    function _tokenToEth(address tokenAddress, uint256 tokenAmount) internal returns (uint256) {
        return _tokenToEth(tokenAddress, tokenAmount, uint256(1));
    }

    function _tokenToEth(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minConversionRate
    ) internal returns (uint256) {
        KyberNetworkProxy kyber = KyberNetworkProxy(KyberNetworkProxyAddress);

        IERC20 token = IERC20(tokenAddress);

        token.approve(address(kyber), tokenAmount);

        return kyber.swapTokenToEther(token, tokenAmount, minConversionRate);
    }

    function _tokenToToken(
        address from,
        address to,
        uint256 tokenAmount,
        uint256 minConversionRate
    ) internal returns (uint256) {
        KyberNetworkProxy kyber = KyberNetworkProxy(KyberNetworkProxyAddress);

        IERC20(from).approve(address(kyber), tokenAmount);

        return kyber.swapTokenToToken(IERC20(from), tokenAmount, IERC20(to), minConversionRate);
    }

    function _tokenToToken(
        address from,
        address to,
        uint256 tokenAmount
    ) internal returns (uint256) {
        return _tokenToToken(from, to, tokenAmount, uint256(1));
    }

    function ethToToken(address tokenAddress) public payable {
        IERC20 token = IERC20(tokenAddress);
        uint256 tokensAmount = _ethToToken(tokenAddress, msg.value, uint256(1));
        token.transfer(msg.sender, tokensAmount);
    }

    function tokenToToken(address fromAddress, address toAddress) public payable {
        IERC20 toToken = IERC20(fromAddress);
        uint256 tokensAmount = _tokenToToken(fromAddress, toAddress, msg.value);
        toToken.transfer(msg.sender, tokensAmount);
    }
}
