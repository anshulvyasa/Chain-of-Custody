pragma solidity ^0.8.0;

import {Investigator} from "./investigator.sol";

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct CaseInfo {
    string caseTitle;
    uint createdAt;
    address createdBy;
}

struct DocumentInfo {
    string hash; // hash of the document
    string cid; // content identifier
}

contract Case is Investigator {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.StringSet;

    mapping(string => CaseInfo) private caseToDetail;
    mapping(string => EnumerableSet.AddressSet) private caseToInvestigator;
    mapping(address => EnumerableSet.StringSet) private investigatorToCases;
    mapping(string => mapping(string => DocumentInfo))
        private caseDocumentToHash;

    // case events
    event CaseAdded(
        address indexed investigator,
        string caseId,
        string caseTitle,
        uint timestamp
    );

    event InvestigatorAddedToCase(
        address indexed investigator,
        address indexed from,
        string caseId,
        uint timestamp
    );

    event DocumentHashAdded(
        address indexed investigator,
        string caseId,
        string documentPath,
        DocumentInfo info
    );

    constructor(
        address[] memory _initialInvestgators
    ) Investigator(_initialInvestgators) {}

    function createCase(
        CaseInfo memory currentCase,
        string memory caseId
    ) public OnlyAdminInvestigator {
        caseToDetail[caseId] = currentCase;
        caseToInvestigator[caseId].add(msg.sender);
        investigatorToCases[msg.sender].add(caseId);

        emit CaseAdded(
            msg.sender,
            caseId,
            currentCase.caseTitle,
            block.timestamp
        );
        emit InvestigatorAddedToCase(
            msg.sender,
            address(this),
            caseId,
            block.timestamp
        );
    }

    function addInvestigatorToCase(
        address _investigator,
        string memory _caseId
    ) public OnlyAdminInvestigator {
        bool status = caseToInvestigator[_caseId].contains(msg.sender);
        require(
            status,
            "You are not Allowded to add The investigator in this case"
        );

        caseToInvestigator[_caseId].add(_investigator);
        investigatorToCases[_investigator].add(_caseId);

        emit InvestigatorAddedToCase(
            _investigator,
            msg.sender,
            _caseId,
            block.timestamp
        );
    }

    function addDocumentHash(
        string memory _caseId,
        string memory _documentPath,
        string memory _hash,
        string memory _cid
    ) public {
        require(
            caseToInvestigator[_caseId].contains(msg.sender),
            "You are not authorized to update this document"
        );

        caseDocumentToHash[_caseId][_documentPath] = DocumentInfo(_hash, _cid);
        emit DocumentHashAdded(
            msg.sender,
            _caseId,
            _documentPath,
            DocumentInfo(_hash, _cid)
        );
    }

    function getInvestigatorsForCase(
        string memory _caseId
    ) public view returns (address[] memory) {
        return caseToInvestigator[_caseId].values();
    }

    function getCasesForInvestigator() public view returns (string[] memory) {
        return investigatorToCases[msg.sender].values();
    }
}
