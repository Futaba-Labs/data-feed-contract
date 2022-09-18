// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IDatabase {
    struct DataFeed {
        string name;
        uint256 timestamp;
        bytes value;
    }

    event UpdatedValue(
        bytes32 indexed id,
        string name,
        uint256 timestamp,
        bytes value
    );

    function setSigner(address signer) external;

    function storeData(
        bytes calldata data,
        bytes calldata signature,
        uint256 timestamp,
        uint32 srcChainId,
        address srcContract
    ) external payable;

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string[] calldata valuableNames
    ) external view returns (bytes[] memory values);

    function deriveDBId(
        uint32 srcChainId,
        address srcContract,
        string memory valuableName
    ) external pure returns (bytes32 id);
}
