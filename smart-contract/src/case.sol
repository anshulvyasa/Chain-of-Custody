pragma solidity ^0.8.0;

import {Investigator, InvestigatorData, InvestigatorAuthority} from "./investigator.sol";

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
    mapping(string => mapping(address => EnumerableSet.StringSet))
        private investigatorAllowedPaths;
    string[] private allCaseIds;

    // case events
    event CaseAdded(
        address indexed investigator,
        string caseId,
        string caseTitle,
        uint timestamp,
        InvestigatorAuthority initiatorAuthority
    );

    event InvestigatorAddedToCase(
        address indexed investigator,
        address indexed from,
        string caseId,
        uint timestamp,
        InvestigatorAuthority targetAuthority,
        InvestigatorAuthority initiatorAuthority
    );

    event InvestigatorRemovedFromCase(
        address indexed investigator,
        address indexed from,
        string caseId,
        uint timestamp,
        InvestigatorAuthority targetAuthority,
        InvestigatorAuthority initiatorAuthority
    );

    event DocumentHashAdded(
        address indexed investigator,
        string caseId,
        string documentPath,
        uint timestamp,
        DocumentInfo info,
        InvestigatorAuthority initiatorAuthority
    );

    event AccessDocument(
        address indexed investigator,
        string caseId,
        string docuemntPath,
        uint timeStamp,
        InvestigatorAuthority initiatorAuthority
    );

    event InvestigatorPathAllowed(
        address indexed investigator,
        address indexed admin,
        string caseId,
        string documentPath,
        uint timestamp,
        InvestigatorAuthority targetAuthority,
        InvestigatorAuthority initiatorAuthority
    );

    event InvestigatorPathRevoked(
        address indexed investigator,
        address indexed admin,
        string caseId,
        string documentPath,
        uint timestamp,
        InvestigatorAuthority targetAuthority,
        InvestigatorAuthority initiatorAuthority
    );

    constructor(
        address[] memory _initialInvestgators
    ) Investigator(_initialInvestgators) {}

    function createCase(
        CaseInfo memory currentCase,
        string memory caseId
    ) public OnlyAdminsInvestigator {
        caseToDetail[caseId] = currentCase;
        caseToInvestigator[caseId].add(msg.sender);
        investigatorToCases[msg.sender].add(caseId);
        allCaseIds.push(caseId);

        emit CaseAdded(
            msg.sender,
            caseId,
            currentCase.caseTitle,
            block.timestamp,
            investigators[msg.sender].investigatorAuthority
        );
        emit InvestigatorAddedToCase(
            msg.sender,
            address(this),
            caseId,
            block.timestamp,
            investigators[msg.sender].investigatorAuthority,
            investigators[address(this)].investigatorAuthority
        );
    }

    function addInvestigatorToCase(
        address _investigator,
        string memory _caseId
    ) public OnlyAdminsInvestigator {
        InvestigatorData memory sender = investigators[msg.sender];
        bool isSpecialAdmin = sender.investigatorAuthority ==
            InvestigatorAuthority.SPECIALADMIN;
        bool status = caseToInvestigator[_caseId].contains(msg.sender) ||
            isSpecialAdmin;
        require(
            status,
            "You are not Allowded to add The investigator in this case"
        );

        InvestigatorData memory target = investigators[_investigator];
        require(target.exist, "Investigator does not exist in the system");
        require(
            target.investigatorAuthority != InvestigatorAuthority.SPECIALADMIN,
            "Special admins inherently have access to all cases"
        );

        bool wasAdded = caseToInvestigator[_caseId].add(_investigator);
        require(wasAdded, "Investigator is already in this case");

        investigatorToCases[_investigator].add(_caseId);

        emit InvestigatorAddedToCase(
            _investigator,
            msg.sender,
            _caseId,
            block.timestamp,
            investigators[_investigator].investigatorAuthority,
            investigators[msg.sender].investigatorAuthority
        );
    }

    function removeInvestigatorFromCase(
        address _investigator,
        string memory _caseId
    ) public {
        InvestigatorData memory sender = investigators[msg.sender];
        require(sender.exist, "You are not a registered investigator");

        bool isSpecialAdmin = sender.investigatorAuthority == InvestigatorAuthority.SPECIALADMIN;
        bool isCaseCreator = caseToDetail[_caseId].createdBy == msg.sender;
        require(
            isSpecialAdmin || isCaseCreator,
            "Only Special Admins or the case creator can remove investigators"
        );

        InvestigatorData memory target = investigators[_investigator];
        require(target.exist, "Investigator does not exist in the system");
        require(
            caseToInvestigator[_caseId].contains(_investigator),
            "Investigator is not part of this case"
        );

        caseToInvestigator[_caseId].remove(_investigator);
        investigatorToCases[_investigator].remove(_caseId);

        emit InvestigatorRemovedFromCase(
            _investigator,
            msg.sender,
            _caseId,
            block.timestamp,
            investigators[_investigator].investigatorAuthority,
            investigators[msg.sender].investigatorAuthority
        );
    }

    function addDocumentHash(
        string memory _caseId,
        string memory _documentPath,
        string memory _hash,
        string memory _cid
    ) public {
        InvestigatorData memory sender = investigators[msg.sender];
        require(
            caseToInvestigator[_caseId].contains(msg.sender) ||
                sender.investigatorAuthority ==
                InvestigatorAuthority.SPECIALADMIN,
            "You are not authorized to update this document"
        );

        caseDocumentToHash[_caseId][_documentPath] = DocumentInfo(_hash, _cid);
        emit DocumentHashAdded(
            msg.sender,
            _caseId,
            _documentPath,
            block.timestamp,
            DocumentInfo(_hash, _cid),
            investigators[msg.sender].investigatorAuthority
        );
    }

    function accessDocument(
        string memory _caseId,
        string memory _docuemntPath
    ) public {
        InvestigatorData memory sender = investigators[msg.sender];
        bool isSpecialAdmin = sender.investigatorAuthority == InvestigatorAuthority.SPECIALADMIN;
        require(
            caseToInvestigator[_caseId].contains(msg.sender) || isSpecialAdmin,
            "You are not authorized to Access This Document"
        );

        // Whitelist check: non-special-admins must have the path in their allowed list
        if (!isSpecialAdmin) {
            require(
                investigatorAllowedPaths[_caseId][msg.sender].contains(_docuemntPath),
                "You do not have access to this document path"
            );
        }

        emit AccessDocument(
            msg.sender,
            _caseId,
            _docuemntPath,
            block.timestamp,
            investigators[msg.sender].investigatorAuthority
        );
    }

    function allowInvestigatorPath(
        string memory _caseId,
        address _investigator,
        string memory _documentPath
    ) public OnlyAdminsInvestigator {
        require(
            caseToInvestigator[_caseId].contains(_investigator),
            "Investigator is not part of this case"
        );

        investigatorAllowedPaths[_caseId][_investigator].add(_documentPath);

        emit InvestigatorPathAllowed(
            _investigator,
            msg.sender,
            _caseId,
            _documentPath,
            block.timestamp,
            investigators[_investigator].investigatorAuthority,
            investigators[msg.sender].investigatorAuthority
        );
    }

    function revokeInvestigatorPath(
        string memory _caseId,
        address _investigator,
        string memory _documentPath
    ) public OnlyAdminsInvestigator {
        require(
            caseToInvestigator[_caseId].contains(_investigator),
            "Investigator is not part of this case"
        );

        investigatorAllowedPaths[_caseId][_investigator].remove(
            _documentPath
        );

        emit InvestigatorPathRevoked(
            _investigator,
            msg.sender,
            _caseId,
            _documentPath,
            block.timestamp,
            investigators[_investigator].investigatorAuthority,
            investigators[msg.sender].investigatorAuthority
        );
    }

    function getInvestigatorsForCase(
        string memory _caseId
    ) public view returns (address[] memory) {
        return caseToInvestigator[_caseId].values();
    }

    function getCasesForInvestigator()
        public
        view
        returns (string[] memory, CaseInfo[] memory)
    {
        InvestigatorData memory sender = investigators[msg.sender];
        string[] memory caseIds;

        if (
            sender.investigatorAuthority == InvestigatorAuthority.SPECIALADMIN
        ) {
            caseIds = allCaseIds;
        } else {
            caseIds = investigatorToCases[msg.sender].values();
        }

        CaseInfo[] memory caseInfos = new CaseInfo[](caseIds.length);
        for (uint i = 0; i < caseIds.length; i++) {
            caseInfos[i] = caseToDetail[caseIds[i]];
        }
        return (caseIds, caseInfos);
    }
}
