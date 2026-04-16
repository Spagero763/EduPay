// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TeachAgentPayment {
    address public owner;
    uint256 public pricePerQuestion = 1e15; // 0.001 CELO
    uint256 public totalQuestions;

    mapping(uint256 => address) public questionPayer;

    event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function payForQuestion() external payable returns (uint256 questionId) {
        require(msg.value >= pricePerQuestion, "Pay at least 0.001 CELO");
        questionId = totalQuestions++;
        questionPayer[questionId] = msg.sender;
        emit QuestionPaid(msg.sender, questionId, msg.value);
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        pricePerQuestion = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        (bool ok,) = payable(owner).call{value: bal}("");
        require(ok, "Transfer failed");
        emit Withdrawn(owner, bal);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
