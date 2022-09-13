// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IDatabase {
    event UpdatedValue(bytes32 indexed id, bytes value, uint256 timestamp);

    function updateDataFeed(
        bytes32 id,
        bytes calldata value,
        uint256 timestamp
    ) external;

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string calldata valuableName
    ) external view returns (bytes memory value);

    function verifySigner(address _signer)
        external
        view
        returns (bool isAuthorize);
}
