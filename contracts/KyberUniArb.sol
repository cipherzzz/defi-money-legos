pragma solidity ^0.5.0;

import "@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol";
import "@studydefi/money-legos/uniswap/contracts/IUniswapExchange.sol";
import "@studydefi/money-legos/uniswap/contracts/IUniswapFactory.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract KyberUniArb is Ownable {
    
    address constant KyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    IUniswapFactory private uniswapFactory;
    KyberNetworkProxy private kyberNetworkProxy;
    
    enum Exchanges{ KYBER, UNISWAPV1 }
    
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
    
    
    function executeArbitrage(address fromToken, address toToken, uint fromExchange, uint toExchange, uint tradeAmount) public payable onlyOwner{
      
      // Instantiate UniswapFactory
      uniswapFactory = IUniswapFactory(UniswapFactoryAddress);

      // Instantiate KyberNetworkProxy
      kyberNetworkProxy = KyberNetworkProxy(KyberNetworkProxyAddress);
      
      // Initial Trade
      uint firstTradeAmount;
      if(fromExchange == uint(Exchanges.KYBER)) {
        firstTradeAmount = _tokenToTokenKyber(fromToken, toToken, tradeAmount);
      } else if(fromExchange == uint(Exchanges.UNISWAPV1)) {
        firstTradeAmount = _tokenToTokenUniswapV1(fromToken, toToken, tradeAmount);
      } else { 
        require(false, "No initial exchange specified");
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