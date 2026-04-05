// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EduPay.sol";

contract Deploy is Script {
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CUSD_TESTNET = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        vm.startBroadcast();

        EduPay eduPay = new EduPay(CUSD_MAINNET);

        vm.stopBroadcast();

        console.log("EduPay deployed to:", address(eduPay));
        console.log("cUSD address      :", CUSD_MAINNET);
        console.log("Platform fee      :", eduPay.platformFeePercent(), "%");
        console.log("Owner             :", eduPay.owner());
    }
}
