// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./Database.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DBHub {
    using ECDSA for bytes32;

    event DeployNewContract(address contractAddress, address signer);

    // deploy new contract for DB
    function deployDBContract() external payable returns (address addr) {
        bytes memory code = getByteCodeForNewContract(msg.sender);
        assembly {
            addr := create(callvalue(), add(code, 0x20), mload(code))
        }
        // return address 0 on error
        require(addr != address(0), "deploy failed");
        emit DeployNewContract(addr, msg.sender);
    }

    function storeData(
        bytes calldata data,
        bytes calldata signature,
        uint256 timestamp,
        address futabaNode,
        address dbAddress,
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) external payable {
        // verify signature
        require(
            (
                keccak256(abi.encodePacked(timestamp, data))
                    .toEthSignedMessageHash()
            ).recover(signature) == futabaNode,
            "Signature mismatch"
        );

        Database db = Database(dbAddress);
        require(db.verifySigner(futabaNode), "Not authorized signer");
        bytes32 id = db.deriveDBId(srcChainId, srcContract, valuableName);
        db.updateDataFeed(id, data, timestamp);
    }

    function getByteCodeForNewContract(address signer)
        private
        pure
        returns (bytes memory)
    {
        bytes memory bytecode = type(Database).creationCode;
        return abi.encodePacked(bytecode, abi.encode(signer));
    }
}
