import { ethers } from "ethers";
import { abi } from "../artifacts/contracts/Database.sol/Database.json";
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const privateKey = process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : "";
const contractAddress = "0x105990E8EbCd11F065304fB1Db79889176B24AFA";
const srcContractAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

async function readData(): Promise<void> {
  const provider = new ethers.providers.AlchemyProvider("maticmum", process.env.POLYGON_TESTNET_API_KEY);
  const walletWithProvider = new ethers.Wallet(privateKey, provider);
  const signer = walletWithProvider.connect(provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const chainId = walletWithProvider.getChainId()
  const data = await contract.readDataFeed(chainId, srcContractAddress, ["contractAddress", "num", "usernames"]);
  console.log(data)
}


readData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});