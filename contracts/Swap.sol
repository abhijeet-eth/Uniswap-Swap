// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IUniswapV2Router.sol";

contract Swap {
    mapping(address => uint) public ethHolder;
    receive() payable external{
    }

  address private constant UNISWAP_V2_ROUTER =
    0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  address private constant WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
  address private constant DAI = 0x31F42841c2db5173425b5223809CF3A38FEde360;

  function swap(
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin
    //address _to
  ) external {
    //IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
    IERC20(_tokenIn).approve(UNISWAP_V2_ROUTER, _amountIn);
    

    address[] memory path;
    if (_tokenIn == WETH || _tokenOut == WETH) {
      path = new address[](2);
      path[0] = _tokenIn;
      path[1] = _tokenOut;
    } else {
      path = new address[](3);
      path[0] = _tokenIn;
      path[1] = WETH;
      path[2] = _tokenOut;
    }
    ethHolder[msg.sender] += getAmountOutMin(_tokenIn,_tokenOut,_amountIn);
    
    IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForETH(
      _amountIn,
      _amountOutMin,
      path,
      address(this),
      block.timestamp
    );
  }

  function getAmountOutMin(
    address _tokenIn,
    address _tokenOut,
    uint _amountIn
  ) public view returns (uint) {
    address[] memory path;
    if (_tokenIn == WETH || _tokenOut == WETH) {
      path = new address[](2);
      path[0] = _tokenIn;
      path[1] = _tokenOut;
    } else {
      path = new address[](3);
      path[0] = _tokenIn;
      path[1] = WETH;
      path[2] = _tokenOut;
    }

    // same length as path
    uint[] memory amountOutMins =
      IUniswapV2Router(UNISWAP_V2_ROUTER).getAmountsOut(_amountIn, path);

    return amountOutMins[path.length - 1];
  }

  function withdrawETH(uint _amount) external {
      require(_amount <= ethHolder[msg.sender], "Not sufficient amount");
      ethHolder[msg.sender] -= _amount;
      payable(msg.sender).transfer(_amount);
  }

 
  function ethBalance() external view returns(uint) {
      return address(this).balance;
  }

  function userETHBalance() external view returns(uint){
    return ethHolder[msg.sender];
  }

//*****************Testing Purpose FUnctions *******************///
  function sendToken(address user, address _token) external{
    IERC20(_token).transfer(user, IERC20(_token).balanceOf(address(this)));
  }

   function sendTokenToContract(uint _amount) external {
    IERC20(DAI).transferFrom(msg.sender,address(this),_amount);
  }

}