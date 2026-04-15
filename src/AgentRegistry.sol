// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    struct Agent {
        address owner;
        string agentURI;
        uint256 registeredAt;
        bool active;
    }

    uint256 public agentCount;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;

    struct Feedback {
        address from;
        int8 score;
        string tag;
        uint256 timestamp;
    }
    mapping(uint256 => Feedback[]) public feedbacks;
    mapping(uint256 => int256) public totalScore;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
    event FeedbackGiven(uint256 indexed agentId, address indexed from, int8 score, string tag);

    function register(string memory _agentURI) external returns (uint256 agentId) {
        agentId = agentCount++;
        agents[agentId] = Agent({owner: msg.sender, agentURI: _agentURI, registeredAt: block.timestamp, active: true});
        ownerAgents[msg.sender].push(agentId);
        emit AgentRegistered(agentId, msg.sender, _agentURI);
    }

    function giveFeedback(uint256 _agentId, int8 _score, string memory _tag) external {
        require(_agentId < agentCount, "Agent not found");
        require(_score >= -100 && _score <= 100, "Score out of range");
        feedbacks[_agentId].push(Feedback({from: msg.sender, score: _score, tag: _tag, timestamp: block.timestamp}));
        totalScore[_agentId] += _score;
        emit FeedbackGiven(_agentId, msg.sender, _score, _tag);
    }

<<<<<<< HEAD
    function getReputation(uint256 _agentId) external view returns (int256 total, uint256 count, int256 average) {
        total = totalScore[_agentId];
        count = feedbacks[_agentId].length;
=======
    function getReputation(uint256 _agentId) external view returns (
        int256 total, uint256 count, int256 average
    ) {
        require(_agentId < agentCount, "Agent not found"); // <--- SAFETY FIX
        total   = totalScore[_agentId];
        count   = feedbacks[_agentId].length;
>>>>>>> d8edcdfe0cf9a0dd0d1cb45ca1b6689b47ab51f0
        average = count > 0 ? total / int256(count) : int256(0);
    }

    function getOwnerAgents(address _owner) external view returns (uint256[] memory) {
        return ownerAgents[_owner];
    }
}