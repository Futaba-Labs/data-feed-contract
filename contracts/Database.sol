// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IDatabase.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Database from other chain data
 * @author Tomoki Adachi
 * @notice You can use this contract for storing and reading data
 */

contract Database is IDatabase {
    using ECDSA for bytes32;

    address[] private signers;

    mapping(bytes32 => DataFeed) private dataFeeds;

    /**
     * @notice Set signer who stores data
     * @dev Set signer address
     * @param signer The signer's address
     */

    function setSigner(address signer) external {
        signers.push(signer);
    }

    /**
     * @notice Verify siganture and store data
     * @dev Decode into an array per variable
     * @param data Other chain data
     * @param signature Signature using data and timestamp
     * @param timestamp Time data was acquired
     * @param srcChainId Chain ID of data acquisition destination
     * @param srcContract Contract address from which data is acquired
     */

    function storeData(
        bytes calldata data,
        bytes calldata signature,
        uint256 timestamp,
        uint32 srcChainId,
        address srcContract
    ) external payable {
        // verify signature
        require(
            verifySignature(data, signature),
            "Signature mismatch"
        );

        DataFeed[] memory feeds = abi.decode(data, (DataFeed[]));
        updateDataFeed(srcChainId, srcContract, feeds);
    }

    /**
     * @notice Update data
     * @dev Assigning data to mapping
     * @param srcChainId Chain ID of data acquisition destination
     * @param srcContract Contract address from which data is acquired
     * @param data Other chain data(array per variable)
     */

    function updateDataFeed(
        uint32 srcChainId,
        address srcContract,
        DataFeed[] memory data
    ) private {
        for (uint256 i = 0; i < data.length; i++) {
            DataFeed memory d = data[i];
            bytes32 id = deriveDBId(srcChainId, srcContract, d.name);
            dataFeeds[id] = d;
            emit UpdatedValue(id, d.name, d.timestamp, d.value);
        }
    }

    /**
     * @notice Reda data
     * @param srcChainId Chain ID of data acquisition destination
     * @param srcContract Contract address from which data is acquired
     * @param valuableNames Variable names of the data to be acquired
     */

    function readDataFeed(
        uint32 srcChainId,
        address srcContract,
        string[] calldata valuableNames
    ) external view returns (bytes[] memory values) {
        values = new bytes[](valuableNames.length);
        for (uint256 i = 0; i < valuableNames.length; i++) {
            bytes32 id = this.deriveDBId(
                srcChainId,
                srcContract,
                valuableNames[i]
            );
            values[i] = dataFeeds[id].value;
        }
    }

    /**
     * @notice Verify signture
     * @param data Other chain data
     * @param signature Signature using data and timestamp
     */

    function verifySignature(
        bytes calldata data,
        bytes calldata signature
    ) public view returns (bool) {
        address signer = (
            keccak256(abi.encodePacked(data))
                .toEthSignedMessageHash()
        ).recover(signature);
        require(
            signer != address(0) && signer == msg.sender,
            "Signature doesn't match"
        );
        require(verifySigner(signer), "Not authorized signer");

        return true;
    }

    /**
     * @notice Verify authorized signer
     * @param _signer Transaction sender
     */

    function verifySigner(address _signer) private view returns (bool) {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Calculate database ID
     * @dev Encode and hash chainId, contract address, and variable name
     * @param srcChainId Chain ID of data acquisition destination
     * @param srcChainId Contract address from which data is acquired
     * @param valuableName Variable name of the data to be acquired
     */

    function deriveDBId(
        uint32 srcChainId,
        address srcContract,
        string memory valuableName
    ) public pure returns (bytes32 id) {
        id = keccak256(abi.encodePacked(srcChainId, srcContract, valuableName));
    }

    function encode(DataFeed[] calldata feed) external pure returns (bytes memory) {
        return abi.encode(feed);
    }
}
