export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CASE_CONTRACT_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_initialInvestgators",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "accessDocument",
    "inputs": [
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_docuemntPath",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addDocumentHash",
    "inputs": [
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_documentPath",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_hash",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_cid",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addInvestigatorToCase",
    "inputs": [
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addNewInvestigator",
    "inputs": [
      {
        "name": "_newInvestigator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_authority",
        "type": "uint8",
        "internalType": "enum InvestigatorAuthority"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createCase",
    "inputs": [
      {
        "name": "currentCase",
        "type": "tuple",
        "internalType": "struct CaseInfo",
        "components": [
          {
            "name": "caseTitle",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "createdAt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "createdBy",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "caseId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getCasesForInvestigator",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct CaseInfo[]",
        "components": [
          {
            "name": "caseTitle",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "createdAt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "createdBy",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getInvestigatorsForCase",
    "inputs": [
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "investigators",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "investigatorAuthority",
        "type": "uint8",
        "internalType": "enum InvestigatorAuthority"
      },
      {
        "name": "exist",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "promoteToAdmin",
    "inputs": [
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "promoteToSpecialAdmin",
    "inputs": [
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeCompromizedInvestigator",
    "inputs": [
      {
        "name": "_investigators",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeExistingInvestigator",
    "inputs": [
      {
        "name": "_investigators",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeInvestigatorFromCase",
    "inputs": [
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "restrictInvestigatorPath",
    "inputs": [
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_documentPath",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unrestrictInvestigatorPath",
    "inputs": [
      {
        "name": "_caseId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_investigator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_documentPath",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AccessDocument",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "docuemntPath",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timeStamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CaseAdded",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "caseTitle",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DocumentHashAdded",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "documentPath",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "info",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct DocumentInfo",
        "components": [
          {
            "name": "hash",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "cid",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorAddedToCase",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorPathRestricted",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "admin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "documentPath",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorPathUnrestricted",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "admin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "documentPath",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorPromotedToAdmin",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorPromotedToSpecialAdmin",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvestigatorRemovedFromCase",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "caseId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NewInvestigatorAdded",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "investigatorAuthority",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum InvestigatorAuthority"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RemoveCompromizedInvestigator",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "investigatorAuthority",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum InvestigatorAuthority"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RemoveExistingInvestigator",
    "inputs": [
      {
        "name": "investigator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "investigatorAuthority",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum InvestigatorAuthority"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
]