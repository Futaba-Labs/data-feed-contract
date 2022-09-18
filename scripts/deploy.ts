import { ethers } from "hardhat";

async function main() {
  const Database = await ethers.getContractFactory("Database");
  const db = await Database.deploy();

  await db.deployed();

  console.log(`deployed to ${db.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
