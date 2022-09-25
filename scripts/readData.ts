import { BigNumber, ethers } from "ethers";
import { abi } from "../artifacts/contracts/Database.sol/Database.json";
import * as dotenv from 'dotenv';
import { formatEther, formatUnits, parseUnits } from "ethers/lib/utils";

dotenv.config({ path: '../.env' });

const privateKey = process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : "";
const contractAddress = "0xd737408b3CE7c6559496ea0cAde16A951945356b";
const srcContractAddress = "0x45dDa9cb7c25131DF268515131f647d726f50608"
const SECONDS_PER_YEAR = 31536000

async function readData(): Promise<void> {
  const provider = new ethers.providers.AlchemyProvider("maticmum", process.env.POLYGON_TESTNET_API_KEY);
  const walletWithProvider = new ethers.Wallet(privateKey, provider);
  const signer = walletWithProvider.connect(provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const chainId = walletWithProvider.getChainId()
  const data = await contract.readDataFeed(137, srcContractAddress, ["liquidity"]);

  console.log('parsed data: ' + parseInt(data))
  const depositAPR = parseInt(data) / 10 ** 27
  console.log('depositAPR: ' + depositAPR)
  const depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1
  console.log('depositAPY: ' + depositAPY)
}


readData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});