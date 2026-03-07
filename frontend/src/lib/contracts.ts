export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CASE_CONTRACT_ABI = [
  {
    "type": "function",
    "name": "createCase",
    "inputs": [
      {
        "type": "tuple",
        "name": "currentCase",
        "components": [
          { "type": "string", "name": "caseTitle" },
          { "type": "uint256", "name": "createdAt" },
          { "type": "address", "name": "createdBy" }
        ]
      },
      { "type": "string", "name": "caseId" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addInvestigatorToCase",
    "inputs": [
      { "type": "address", "name": "_investigator" },
      { "type": "string", "name": "_caseId" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addDocumentHash",
    "inputs": [
      { "type": "string", "name": "_caseId" },
      { "type": "string", "name": "_documentId" },
      { "type": "string", "name": "_hash" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "investigators",
    "inputs": [{ "type": "address", "name": "" }],
    "outputs": [{ "type": "bool", "name": "" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CaseAdded",
    "inputs": [
      { "type": "address", "name": "investigator", "indexed": true },
      { "type": "string", "name": "caseId", "indexed": true },
      { "type": "uint256", "name": "timestamp", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorAddedToCase",
    "inputs": [
      { "type": "address", "name": "investigator", "indexed": true },
      { "type": "address", "name": "from", "indexed": true },
      { "type": "string", "name": "caseId", "indexed": true },
      { "type": "uint256", "name": "timestamp", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DocumentHashAdded",
    "inputs": [
      { "type": "address", "name": "investigator", "indexed": true },
      { "type": "string", "name": "caseId", "indexed": true },
      { "type": "string", "name": "documentId", "indexed": true },
      { "type": "string", "name": "hash", "indexed": false }
    ],
    "anonymous": false
  }
] as const;
