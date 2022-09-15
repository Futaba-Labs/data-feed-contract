import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractReceipt, utils } from "ethers";
import { ethers } from "hardhat";
import { Database, Database__factory } from "../typechain-types";
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"

interface DataFeed {
  name: string
  timestamp: BigNumber
  value: string
}

interface RawData {
  name: string
  type: string
  value: any
}

interface DatabaseFixture {
  Database: Database__factory
  db: Database
  owner: SignerWithAddress
  addr1: SignerWithAddress
  addr2: SignerWithAddress
  enocdedData: string
  timestamp: number
  rawData: RawData[]
  eachEncodedData: DataFeed[]
}

describe("Database contract", function () {
  const CONTRACT_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
  const CHIAN_ID = 1

  async function deployDatabaseFixture(): Promise<DatabaseFixture> {
    const Database = await ethers.getContractFactory("Database");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const db = await Database.deploy();

    await db.deployed();

    // create test data from other chain
    const rawData: RawData[] = [{ name: "contractAddress", type: "address", value: "0x1F98431c8aD98523631AE4a59f267346ea31F984" }, { name: "num", type: "uint256", value: 1 }, { name: "usernames", type: "string[]", value: ["Fu", "Ta", "Ba"] }];

    const timestamp = Math.round((new Date()).getTime() / 1000)

    const eachEncodedData: DataFeed[] = rawData.map(d => {
      return { name: d.name, timestamp: BigNumber.from(timestamp), value: utils.defaultAbiCoder.encode([d.type], [d.value]) }
    })
    const enocdedData = utils.defaultAbiCoder.encode(["tuple(string name, uint256 timestamp, bytes value)[] DataFeed"], [eachEncodedData])

    await db.setSigner(owner.getAddress())

    return { Database, db, owner, addr1, addr2, enocdedData, timestamp, rawData, eachEncodedData };
  }

  // implement signature method
  async function sign(enocdedData: string, timestamp: number, owner: SignerWithAddress) {
    const messageHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [enocdedData, timestamp])
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));
    return signature
  }

  describe("Verify signature", function () {
    it("Should verify right signture", async function () {
      const { db, owner, enocdedData, timestamp }: DatabaseFixture = await loadFixture(deployDatabaseFixture);

      // create signature
      const messageHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [enocdedData, timestamp])
      const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

      // verify signature on contract
      expect(await db.verifySignature(enocdedData, signature, timestamp)).to.equal(true)
    });

    it("Should be invalid signture", async function () {
      const { db, owner, enocdedData, timestamp }: DatabaseFixture = await loadFixture(deployDatabaseFixture);

      // create signature
      const messageHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [enocdedData, timestamp + 1])
      const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

      // verify signature on contract
      await expect(db.verifySignature(enocdedData, signature, timestamp)).to.be.revertedWith("Signature doesn't match");
    });

    it("Should not be authorized signer", async function () {
      const { Database, db, addr1, enocdedData, timestamp }: DatabaseFixture = await loadFixture(deployDatabaseFixture);

      // connect contract to addr1
      const contract = db.connect(addr1);

      // create signature
      const messageHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [enocdedData, timestamp])
      const signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));

      // verify signature on contract
      await expect(contract.verifySignature(enocdedData, signature, timestamp)).to.be.revertedWith("Not authorized signer");
    });
  })

  describe("Store and read data", function () {
    it("Should store new data", async function () {
      const { db, owner, enocdedData, timestamp, eachEncodedData }: DatabaseFixture = await loadFixture(deployDatabaseFixture);
      const signature = await sign(enocdedData, timestamp, owner)

      // send transaction
      const tx = await db.storeData(enocdedData, signature, timestamp, CHIAN_ID, CONTRACT_ADDRESS)
      const resTx: ContractReceipt = await tx.wait()
      const events = resTx.events

      // check event
      for (let i = 0; i < eachEncodedData.length; i++) {
        const name = eachEncodedData[i].name
        const id = ethers.utils.solidityKeccak256(["uint32", "address", "string"], [CHIAN_ID, CONTRACT_ADDRESS, name])
        const value = eachEncodedData[i].value
        if (events !== undefined) {
          expect(events[i].args?.id)
            .to.equal(id)
          expect(events[i].args?.name)
            .to.equal(name)
          expect(events[i].args?.timestamp)
            .to.equal(timestamp)
          expect(events[i].args?.value)
            .to.equal(value)
        }
      }
    })

    it("Should update data", async function () {
      const { db, owner, enocdedData, timestamp, eachEncodedData }: DatabaseFixture = await loadFixture(deployDatabaseFixture);
      const signature = await sign(enocdedData, timestamp, owner)

      // store data
      let tx = await db.storeData(enocdedData, signature, timestamp, CHIAN_ID, CONTRACT_ADDRESS)
      await tx.wait()

      // update data
      const newData: RawData[] = [{ name: "contractAddress", type: "address", value: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" }, { name: "num", type: "uint256", value: 5 }, { name: "usernames", type: "string[]", value: ["A", "Da", "Chi"] }];
      const newTimestamp = timestamp + 1000

      const newEachEncodedData: DataFeed[] = newData.map(d => {
        return { name: d.name, timestamp: BigNumber.from(newTimestamp), value: utils.defaultAbiCoder.encode([d.type], [d.value]) }
      })
      const newEnocdedData = utils.defaultAbiCoder.encode(["tuple(string name, uint256 timestamp, bytes value)[] DataFeed"], [newEachEncodedData])

      const newSignature = sign(newEnocdedData, newTimestamp, owner)
      tx = await db.storeData(newEnocdedData, newSignature, newTimestamp, CHIAN_ID, CONTRACT_ADDRESS)
      await tx.wait()

      const resTx: ContractReceipt = await tx.wait()
      const events = resTx.events

      // check event
      for (let i = 0; i < newEachEncodedData.length; i++) {
        const name = eachEncodedData[i].name
        const id = ethers.utils.solidityKeccak256(["uint32", "address", "string"], [CHIAN_ID, CONTRACT_ADDRESS, name])
        const value = eachEncodedData[i].value

        const newName = newEachEncodedData[i].name
        const newId = ethers.utils.solidityKeccak256(["uint32", "address", "string"], [CHIAN_ID, CONTRACT_ADDRESS, newName])
        const newValue = newEachEncodedData[i].value

        if (events !== undefined) {
          expect(events[i].args?.id)
            .to.equal(newId)
          expect(events[i].args?.name)
            .to.equal(newName)
          expect(events[i].args?.timestamp)
            .to.equal(newTimestamp)
          expect(events[i].args?.value)
            .to.equal(newValue)

          expect(id)
            .to.equal(newId)
          expect(name)
            .to.equal(newName)
          expect(timestamp)
            .to.not.equal(newTimestamp)
          expect(value)
            .to.not.equal(newValue)
        }
      }
    })
  })
});
