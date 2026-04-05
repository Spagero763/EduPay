// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EduPay.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        EduPay eduPay = new EduPay();

        vm.stopBroadcast();

        console.log("EduPay deployed to:", address(eduPay));
        console.log("Accepted tokens:");
        console.log("  cUSD :", eduPay.CUSD());
        console.log("  USDC :", eduPay.USDC());
        console.log("Platform fee:", eduPay.platformFeePercent(), "%");
        console.log("Owner       :", eduPay.owner());
    }
}
