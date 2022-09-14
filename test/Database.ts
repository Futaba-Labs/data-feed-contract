import { ethers } from "hardhat";

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Database contract", function () {
  async function deployDatabaseFixture() {
    const Database = await ethers.getContractFactory("Database");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const db = await Database.deploy();

    await db.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { Database, db, owner, addr1, addr2 };
  }

  // implement signature method

  it("Should verify right signture", async function () {
    const { db, owner } = await loadFixture(deployDatabaseFixture);

    // create signature
    // verify signature on contract
  });

  it("Should not be invalid signture", async function () {
    const { db, owner } = await loadFixture(deployDatabaseFixture);

    // create signature
    // verify signature on contract
  });

});