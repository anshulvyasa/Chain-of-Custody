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

contract Case is Investigator {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(string => CaseInfo) private caseToDetail;
    mapping(string => EnumerableSet.AddressSet) private caseToInvestigator;
    mapping(string => mapping(string => string)) private caseDocumentToHash;

    // case events
    event CaseAdded(
        address indexed investigator,
        string indexed caseId,
        uint timestamp
    );

    event InvestigatorAddedToCase(
        address indexed investigator,
        address indexed from,
        string indexed caseId,
        uint timestamp
    );

    event DocumentHashAdded(
        address indexed investigator,
        string indexed caseId,
        string indexed documentId,
        string hash
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

        emit CaseAdded(msg.sender, caseId, block.timestamp);
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
        emit InvestigatorAddedToCase(
            _investigator,
            msg.sender,
            _caseId,
            block.timestamp
        );
    }

    function addDocumentHash(
        string memory _caseId,
        string memory _documentId,
        string memory _hash
    ) public {
        require(
            caseToInvestigator[_caseId].contains(msg.sender),
            "You are not authorized to update this document"
        );

        caseDocumentToHash[_caseId][_documentId] = _hash;
        emit DocumentHashAdded(msg.sender, _caseId, _documentId, _hash);
    }
}
