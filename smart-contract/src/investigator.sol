// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract Investigator {
    mapping(address => bool) public investigators;

    event NewInvestigatorAdded(
        address indexed investigator,
        address indexed from,
        uint timestamp
    );

    event RemoveExistingInvestigator(
        address indexed investigator,
        address indexed from,
        uint timestamp
    );

    event RemoveCompromizedInvestigator(
        address indexed _investigator,
        address indexed from,
        uint timestamp
    );

    modifier OnlyAdminInvestigator() {
        require(
            investigators[msg.sender] == true,
            "You are not Authorized to perform this action"
        );
        _;
    }

    constructor(address[] memory _initialInvestigators) {
        for (uint i = 0; i < _initialInvestigators.length; i++) {
            investigators[_initialInvestigators[i]] = true;
            emit NewInvestigatorAdded(
                _initialInvestigators[i],
                address(this),
                block.timestamp
            );
        }
    }

    function addNewInvestigator(
        address _newInvestigator,
        bool _haveAdminPermission
    ) public OnlyAdminInvestigator {
        // Prevent emitting an event if they are already an investigator
        require(!investigators[_newInvestigator], "Already an investigator");

        investigators[_newInvestigator] = _haveAdminPermission;

        emit NewInvestigatorAdded(
            _newInvestigator,
            msg.sender,
            block.timestamp
        );
    }

    function removeExistingInvestigator(
        address[] memory _investigators
    ) public OnlyAdminInvestigator {
        for (uint i = 0; i < _investigators.length; i++) {
            if (investigators[_investigators[i]] == true) {
                delete investigators[_investigators[i]];
                emit RemoveExistingInvestigator(
                    _investigators[i],
                    msg.sender,
                    block.timestamp
                );
            }
        }
    }

    function removeCompromizedInvestigator(
        address[] memory _investigators
    ) public OnlyAdminInvestigator {
        for (uint i = 0; i < _investigators.length; i++) {
            if (investigators[_investigators[i]] == true) {
                delete investigators[_investigators[i]];
                emit RemoveCompromizedInvestigator(
                    _investigators[i],
                    msg.sender,
                    block.timestamp
                );
            }
        }
    }
}


