import { ethers } from "hardhat";

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("DBHub contract", function () {
  async function deployDBHubFixture() {
    const DBHub = await ethers.getContractFactory("DBHub");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const db = await DBHub.deploy();

    await db.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { DBHub, db, owner, addr1, addr2 };
  }

  describe("New Contract Deployment", function () {
    it("Should set the right sender and contract address", async function () {
      // We use loadFixture to setup our environment, and then assert that
      // things went well
      const { db, owner } = await loadFixture(deployDBHubFixture);
      const tx = await db.deployDBContract();
      await expect(tx)
        .to.emit(db, "DeployNewContract").withArgs(anyValue, owner.address);
      const result = await tx.wait()
      const contractAddress = result.events[0].args.contractAddress;
      const NewContract = await ethers.getContractFactory("Database");
      const contract = NewContract.attach(
        contractAddress
      );
      expect(await contract.verifySigner(owner.address)).to.equal(true);
    });
  });

});