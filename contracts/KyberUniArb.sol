pragma solidity ^0.5.0;

import "@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol";
import "@studydefi/money-legos/uniswap/contracts/IUniswapExchange.sol";
import "@studydefi/money-legos/uniswap/contracts/IUniswapFactory.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract KyberUniArb is Ownable {

    IUniswapFactory private uniswapFactory;
    KyberNetworkProxy private kyberNetworkProxy;
    
    enum Exchanges{ KYBER, UNISWAPV1 }

    constructor(address uniswapFactoryAddress, address kyberNetworkProxyAddress) public onlyOwner {
      
      // Instantiate UniswapFactory
      uniswapFactory = IUniswapFactory(uniswapFactoryAddress);

      // Instantiate KyberNetworkProxy
      kyberNetworkProxy = KyberNetworkProxy(kyberNetworkProxyAddress);
    }
    
    /*Uniswap Begin */
    function _getUniswapExchange(address tokenAddress) internal view returns (address) {
        return uniswapFactory.getExchange(tokenAddress);
    }
    
    function _ethToToken(address tokenAddress, uint ethAmount)
        internal returns (uint) {
        return _ethToToken(tokenAddress, ethAmount, uint(1));
    }

    function _ethToToken(address tokenAddress, uint ethAmount, uint minTokenAmount)
        internal returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress))
            .ethToTokenSwapInput.value(ethAmount)(minTokenAmount, uint(now + 60));
    }

    function _tokenToEth(address tokenAddress, uint tokenAmount) internal returns (uint) {
        return _tokenToEth(tokenAddress, tokenAmount, uint(1));
    }

    function _tokenToEth(address tokenAddress, uint tokenAmount, uint minEthAmount) internal returns (uint) {
        address exchange = _getUniswapExchange(tokenAddress);
        IERC20(tokenAddress).approve(exchange, tokenAmount);
        return IUniswapExchange(exchange)
            .tokenToEthSwapInput(tokenAmount, minEthAmount, uint(now + 60));
    }

    function _tokenToToken(address from, address to, uint tokenInAmount, uint minTokenOut) internal returns (uint) {
        uint ethAmount = _tokenToEth(from, tokenInAmount);
        return _ethToToken(to, ethAmount, minTokenOut);
    }

    function _tokenToTokenUniswapV1(address from, address to, uint tokenAmount) internal returns (uint) {
        return _tokenToToken(from, to, tokenAmount, uint(1));
    }
    /* Uniswap end  */
  
    

    /* Kyber - so much easier  */
    function _tokenToTokenKyber(address source, address destination, uint tokenAmount) internal returns (uint) {
        IERC20(source).approve(address(kyberNetworkProxy), tokenAmount);
        return kyberNetworkProxy.swapTokenToToken(IERC20(source), tokenAmount, IERC20(destination), uint(1));
    }
    
    
    function executeArbitrage(address[4] memory pairs, uint8[2] memory exchanges, uint tradeAmount) public payable onlyOwner{
      
    }

}