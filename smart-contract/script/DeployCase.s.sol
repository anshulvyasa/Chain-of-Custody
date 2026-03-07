// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/case.sol";

contract DeployCase is Script {
    function run() external {
        // The private key to deploy from. If running on local anvil,
        // account 0 is usually used.
        // Ensure you have a LOCAL_PRIVATE_KEY in your .env or pass it.
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Define initial investigators for the constructor (we will just use the deployer for now)
        address deployerAddress = vm.addr(deployerPrivateKey);
        address[] memory initialInvestigators = new address[](2);
        initialInvestigators[0] = deployerAddress;
        initialInvestigators[1] = 0x304651ce2F9D6CadaaEd9311ffa362632Bea2292;

        // Deploy Contract
        Case custodyCase = new Case(initialInvestigators);

        vm.stopBroadcast();

        // Let the user know where it was deployed
        console.log("Deployed Case Contract at address:", address(custodyCase));
        console.log("Initial Admin Investigator:", deployerAddress);
    }
}
