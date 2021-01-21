pragma solidity ^0.5.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IUniswapV2.sol';

contract UniswapV2 {
    IUniswapV2 uniswap;

    constructor(address _uniswap) public {
        uniswap = IUniswapV2(_uniswap);
    }

    function swapExactETHForTokens(
        address token,
        uint256 amountOut,
        uint256 deadline
    ) external payable {
        address[] memory path = new address[](2);
        path[0] = uniswap.WETH();
        path[1] = token;

        uniswap.swapExactETHForTokens.value(msg.value)(amountOut, path, msg.sender, deadline);
    }

    function swapTokensForExactTokens(
        address tokenIn,
        uint256 amountInMax,
        address tokenOut,
        uint256 amountOut,
        uint256 deadline
    ) external payable {
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountInMax),
            'transferFrom to contract failed.'
        );
        require(IERC20(tokenIn).approve(address(uniswap), amountInMax), 'approve uniswap failed.');

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uniswap.swapTokensForExactTokens(amountOut, amountInMax, path, msg.sender, deadline);
    }

    function getAmounts(address[] calldata path, uint256 amountIn)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory returnedAmount = uniswap.getAmountsOut(amountIn, path);
        return returnedAmount;
    }
}
