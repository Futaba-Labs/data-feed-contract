// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IDatabase {
    struct DataFeed {
        string name;
        bytes value;
        uint256 timestamp;
    }

    event UpdatedValue(
        bytes32 indexed id,
        string name,
        uint256 timestamp,
        bytes value
    );

    function setSigner(address signer) external;

    function storeData(
        DataFeed[] calldata data,
        bytes calldata signature,
        uint256 timestamp,
        address futabaNode,
        uint32 srcChainId,
        address srcContract
    ) external payable;

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string[] calldata valuableNames
    ) external view returns (bytes memory value);

    function deriveDBId(
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) external pure returns (bytes32 id);
}
