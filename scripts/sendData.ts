import { BigNumber, ethers, utils } from "ethers"
import * as dotenv from 'dotenv';
import { abi } from "../artifacts/contracts/Database.sol/Database.json";

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
dotenv.config({ path: '../.env' });
const privateKey = process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : "";
const contractAddress = "0x105990E8EbCd11F065304fB1Db79889176B24AFA";
const srcContractAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

async function sendData(): Promise<void> {
  // create test data from other chain
  const provider = new ethers.providers.AlchemyProvider("maticmum", process.env.POLYGON_TESTNET_API_KEY);
  const walletWithProvider = new ethers.Wallet(privateKey, provider);
  const signer = walletWithProvider.connect(provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);
  const rawData: RawData[] = [{ name: "contractAddress", type: "address", value: "0x1F98431c8aD98523631AE4a59f267346ea31F984" }, { name: "num", type: "uint256", value: 1 }, { name: "usernames", type: "string[]", value: ["Fu", "Ta", "Ba"] }];

  const timestamp = Math.round((new Date()).getTime() / 1000)

  const eachEncodedData: DataFeed[] = rawData.map(d => {
    return { name: d.name, timestamp: BigNumber.from(timestamp), value: utils.defaultAbiCoder.encode([d.type], [d.value]) }
  })
  const enocdedData = utils.defaultAbiCoder.encode(["tuple(string name, uint256 timestamp, bytes value)[] DataFeed"], [eachEncodedData])

  await contract.setSigner(await walletWithProvider.getAddress())

  const messageHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [enocdedData, timestamp])
  const signature = await walletWithProvider.signMessage(ethers.utils.arrayify(messageHash));

  const chainId = await walletWithProvider.getChainId()

  const tx = await contract.storeData(enocdedData, signature, timestamp, chainId, srcContractAddress)
  console.log("waiting...")
  const resTx = await tx.wait()
  const events = resTx.events
  console.log(events)
}

sendData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

