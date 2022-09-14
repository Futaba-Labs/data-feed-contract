// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IDatabase.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Database is IDatabase {
    using ECDSA for bytes32;

    address[] private signers;

    mapping(bytes32 => DataFeed) private dataFeeds;

    function setSigner(address signer) external {
        signers.push(signer);
    }

    function storeData(
        DataFeed[] calldata data,
        bytes calldata signature,
        uint256 timestamp,
        address futabaNode,
        uint32 srcChainId,
        address srcContract
    ) external payable {
        // verify signature
        require(
            (
                keccak256(abi.encodePacked(timestamp, data.length))
                    .toEthSignedMessageHash()
            ).recover(signature) == futabaNode,
            "Signature mismatch"
        );

        require(verifySigner(futabaNode), "Not authorized signer");
        updateDataFeed(srcChainId, srcContract, data);
    }

    function updateDataFeed(
        uint32 srcChainId,
        address srcContract,
        DataFeed[] calldata data
    ) private {
        for (uint256 i = 0; i < data.length; i++) {
            DataFeed calldata d = data[i];
            bytes32 id = deriveDBId(srcChainId, srcContract, d.name);
            dataFeeds[id] = d;
            emit UpdatedValue(id, d.name, d.timestamp, d.value);
        }
    }

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string[] calldata valuableNames
    ) external view returns (bytes memory value) {
        // bytes32 id = this.deriveDBId(srcChainId, srcContract, valuableName);
        // value = dataFeeds[id].value;
    }

    function verifySigner(address _signer) private view returns (bool) {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                return true;
            }
        }
        return false;
    }

    function deriveDBId(
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) public pure returns (bytes32 id) {
        id = keccak256(abi.encodePacked(srcChainId, srcContract, valuableName));
    }
}
