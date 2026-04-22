// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

enum InvestigatorAuthority {
    SPECIALADMIN,
    ADMIN,
    NORMAL
}

struct InvestigatorData {
    InvestigatorAuthority investigatorAuthority;
    bool exist;
}

contract Investigator {
    mapping(address => InvestigatorData) public investigators;

    constructor(address[] memory _initialInvestigators) {
        for (uint i = 0; i < _initialInvestigators.length; i++) {
            investigators[_initialInvestigators[i]] = InvestigatorData(
                InvestigatorAuthority.SPECIALADMIN,
                true
            );
            emit NewInvestigatorAdded(
                _initialInvestigators[i],
                address(this),
                InvestigatorAuthority.SPECIALADMIN, 
                block.timestamp
            );
        }
    }

    event NewInvestigatorAdded(
        address indexed investigator,
        address indexed from,
        InvestigatorAuthority investigatorAuthority,
        uint timestamp
    );

    event RemoveExistingInvestigator(
        address indexed investigator,
        address indexed from,
        InvestigatorAuthority investigatorAuthority,
        uint timestamp
    );

    event RemoveCompromizedInvestigator(
        address indexed investigator,
        address indexed from,
        InvestigatorAuthority investigatorAuthority,
        uint timestamp
    );

    event InvestigatorPromotedToAdmin(
        address indexed investigator,
        address indexed from,
        uint timestamp
    );

    event InvestigatorPromotedToSpecialAdmin(
        address indexed investigator,
        address indexed from,
        uint timestamp
    );

    modifier OnlyAdminsInvestigator() {
        InvestigatorData memory sender = investigators[msg.sender]; 
        require(
            sender.exist &&
                (sender.investigatorAuthority == InvestigatorAuthority.ADMIN ||
                    sender.investigatorAuthority == InvestigatorAuthority.SPECIALADMIN),
            "You are not Authorized to perform this action"
        );
        _;
    }

    modifier OnlySpecialAdminsInvestigator() {
        InvestigatorData memory sender = investigators[msg.sender]; 
        require(
            sender.exist &&
                sender.investigatorAuthority == InvestigatorAuthority.SPECIALADMIN,
            "You are not Authorized to perform this action"
        );
        _;
    }


    function addNewInvestigator(
        address _newInvestigator
    ) public OnlyAdminsInvestigator {
        require(!investigators[_newInvestigator].exist, "Already an investigator");

        investigators[_newInvestigator] = InvestigatorData(
            InvestigatorAuthority.NORMAL,
            true
        );

        emit NewInvestigatorAdded(
            _newInvestigator,
            msg.sender,
            InvestigatorAuthority.NORMAL,
            block.timestamp
        );
    }

    function removeExistingInvestigator(
        address[] memory _investigators
    ) public OnlySpecialAdminsInvestigator {
        for (uint i = 0; i < _investigators.length; i++) {
            InvestigatorData storage data = investigators[_investigators[i]]; 
            if (data.exist) {
                InvestigatorAuthority authority = data.investigatorAuthority;
                delete investigators[_investigators[i]];
                emit RemoveExistingInvestigator(
                    _investigators[i],
                    msg.sender,
                    authority,
                    block.timestamp
                );
            }
        }
    }

    function removeCompromizedInvestigator(
        address[] memory _investigators
    ) public OnlySpecialAdminsInvestigator {
        for (uint i = 0; i < _investigators.length; i++) {
            InvestigatorData storage data = investigators[_investigators[i]]; 
            if (data.exist) {
                InvestigatorAuthority authority = data.investigatorAuthority;
                delete investigators[_investigators[i]];
                emit RemoveCompromizedInvestigator(
                    _investigators[i],
                    msg.sender,
                    authority,
                    block.timestamp
                );
            }
        }
    }

    function promoteToAdmin(
        address _investigator
    ) public OnlySpecialAdminsInvestigator {
        InvestigatorData storage data = investigators[_investigator];
        require(data.exist, "Investigator does not exist");
        require(
            data.investigatorAuthority == InvestigatorAuthority.NORMAL,
            "Investigator must be NORMAL to promote to ADMIN"
        );

        data.investigatorAuthority = InvestigatorAuthority.ADMIN;

        emit InvestigatorPromotedToAdmin(
            _investigator,
            msg.sender,
            block.timestamp
        );
    }

    
    function promoteToSpecialAdmin(
        address _investigator
    ) public OnlySpecialAdminsInvestigator {
        InvestigatorData storage data = investigators[_investigator];
        require(data.exist, "Investigator does not exist");
        require(
            data.investigatorAuthority == InvestigatorAuthority.ADMIN,
            "Investigator must be ADMIN to promote to SPECIALADMIN"
        );

        data.investigatorAuthority = InvestigatorAuthority.SPECIALADMIN;

        emit InvestigatorPromotedToSpecialAdmin(
            _investigator,
            msg.sender,
            block.timestamp
        );
    }
}