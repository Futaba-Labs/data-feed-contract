// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IDatabase.sol";

contract Database is IDatabase {
    address private signer;

    struct DataFeed {
        bytes value;
        uint256 timestamp;
    }

    mapping(bytes32 => DataFeed) private dataFeeds;

    constructor(address _signer) {
        signer = _signer;
    }

    function updateDataFeed(
        bytes32 id,
        bytes calldata value,
        uint256 timestamp
    ) external {
        dataFeeds[id] = DataFeed(value, timestamp);
        emit UpdatedValue(id, value, timestamp);
    }

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) external view returns (bytes memory value) {
        bytes32 id = this.deriveDBId(srcChainId, srcContract, valuableName);
        value = dataFeeds[id].value;
    }

    function verifySigner(address _signer) external view returns (bool) {
        return signer == _signer;
    }

    function deriveDBId(
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) external pure returns (bytes32 id) {
        id = keccak256(abi.encodePacked(srcChainId, srcContract, valuableName));
    }
}
