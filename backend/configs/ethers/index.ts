import { ethers } from 'ethers';
import { CASE_CONTRACT_ABI } from '../contract';

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const contract = new ethers.Contract(CONTRACT_ADDRESS, CASE_CONTRACT_ABI, provider);

