// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EduPay.sol";

// Minimal mock cUSD token for testing
contract MockcUSD is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract EduPayTest is Test {
    EduPay public eduPay;
    MockcUSD public cusd;

    address owner = address(this);
    address tutor = makeAddr("tutor");
    address student = makeAddr("student");

    uint256 constant CHAPTER_PRICE = 1e18; // 1 cUSD

    function setUp() public {
        cusd = new MockcUSD();
        eduPay = new EduPay(address(cusd));

        // Fund student with 100 cUSD
        cusd.mint(student, 100e18);

        // Student approves EduPay to spend
        vm.prank(student);
        cusd.approve(address(eduPay), type(uint256).max);
    }

    // ── Course creation ───────────────────────────────────────

    function test_CreateCourse() public {
        vm.prank(tutor);
        uint256 id = eduPay.createCourse("Solidity 101", "Learn Solidity from scratch");

        (address _tutor, string memory _title,, bool _isActive,,) = eduPay.courses(id);
        assertEq(_tutor, tutor);
        assertEq(_title, "Solidity 101");
        assertTrue(_isActive);
    }

    function test_CreateCourse_EmptyTitle_Reverts() public {
        vm.prank(tutor);
        vm.expectRevert("EduPay: empty title");
        eduPay.createCourse("", "desc");
    }

    // ── Chapter management ────────────────────────────────────

    function test_AddChapter() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        (string memory title, uint256 price, bool purchased) = eduPay.getChapter(courseId, chapId);
        assertEq(title, "Chapter 1");
        assertEq(price, CHAPTER_PRICE);
        assertFalse(purchased);
    }

    function test_AddChapter_NotTutor_Reverts() public {
        vm.prank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");

        vm.prank(student); // student tries to add chapter
        vm.expectRevert("EduPay: not your course");
        eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
    }

    function test_AddChapter_ZeroPrice_Reverts() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        vm.expectRevert("EduPay: zero price");
        eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", 0);
        vm.stopPrank();
    }

    // ── Chapter purchase ──────────────────────────────────────

    function test_PurchaseChapter() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        uint256 tutorBefore = cusd.balanceOf(tutor);
        uint256 studentBefore = cusd.balanceOf(student);

        vm.prank(student);
        eduPay.purchaseChapter(courseId, chapId);

        // Student paid full price
        assertEq(cusd.balanceOf(student), studentBefore - CHAPTER_PRICE);

        // Tutor received 95% (5% fee)
        uint256 expected = CHAPTER_PRICE * 95 / 100;
        assertEq(cusd.balanceOf(tutor), tutorBefore + expected);

        // Contract holds 5% fee
        assertEq(cusd.balanceOf(address(eduPay)), CHAPTER_PRICE * 5 / 100);

        // Student has access
        assertTrue(eduPay.checkAccess(courseId, chapId, student));
    }

    function test_PurchaseChapter_Twice_Reverts() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        vm.startPrank(student);
        eduPay.purchaseChapter(courseId, chapId);
        vm.expectRevert("EduPay: already purchased");
        eduPay.purchaseChapter(courseId, chapId);
        vm.stopPrank();
    }

    // ── Full course purchase ──────────────────────────────────

    function test_PurchaseFullCourse() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm1", CHAPTER_PRICE);
        eduPay.addChapter(courseId, "Chapter 2", "ipfs://Qm2", CHAPTER_PRICE);
        eduPay.addChapter(courseId, "Chapter 3", "ipfs://Qm3", CHAPTER_PRICE);
        vm.stopPrank();

        uint256 studentBefore = cusd.balanceOf(student);

        vm.prank(student);
        eduPay.purchaseFullCourse(courseId);

        uint256 totalCost = CHAPTER_PRICE * 3;
        assertEq(cusd.balanceOf(student), studentBefore - totalCost);

        // All chapters unlocked
        assertTrue(eduPay.checkAccess(courseId, 0, student));
        assertTrue(eduPay.checkAccess(courseId, 1, student));
        assertTrue(eduPay.checkAccess(courseId, 2, student));
    }

    function test_PurchaseFullCourse_SkipsAlreadyPurchased() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm1", CHAPTER_PRICE);
        eduPay.addChapter(courseId, "Chapter 2", "ipfs://Qm2", CHAPTER_PRICE);
        vm.stopPrank();

        // Buy chapter 0 first
        vm.prank(student);
        eduPay.purchaseChapter(courseId, 0);

        uint256 balAfterOne = cusd.balanceOf(student);

        // Full course should only charge for chapter 1
        vm.prank(student);
        eduPay.purchaseFullCourse(courseId);

        assertEq(cusd.balanceOf(student), balAfterOne - CHAPTER_PRICE);
    }

    // ── Content access ────────────────────────────────────────

    function test_GetChapterContent_WithAccess() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        vm.startPrank(student);
        eduPay.purchaseChapter(courseId, chapId);
        string memory content = eduPay.getChapterContent(courseId, chapId);
        assertEq(content, "ipfs://Qm123");
        vm.stopPrank();
    }

    function test_GetChapterContent_NoAccess_Reverts() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        vm.prank(student);
        vm.expectRevert("EduPay: no access");
        eduPay.getChapterContent(courseId, chapId);
    }

    // ── Admin ─────────────────────────────────────────────────

    function test_WithdrawFees() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        uint256 chapId = eduPay.addChapter(courseId, "Chapter 1", "ipfs://Qm123", CHAPTER_PRICE);
        vm.stopPrank();

        vm.prank(student);
        eduPay.purchaseChapter(courseId, chapId);

        uint256 fee = CHAPTER_PRICE * 5 / 100;
        uint256 ownerBefore = cusd.balanceOf(owner);

        eduPay.withdrawFees(); // called by owner (address(this))

        assertEq(cusd.balanceOf(owner), ownerBefore + fee);
        assertEq(cusd.balanceOf(address(eduPay)), 0);
    }

    function test_SetPlatformFee() public {
        eduPay.setPlatformFee(3);
        assertEq(eduPay.platformFeePercent(), 3);
    }

    function test_SetPlatformFee_Above10_Reverts() public {
        vm.expectRevert("EduPay: max 10%");
        eduPay.setPlatformFee(11);
    }

    function test_ToggleCourse() public {
        vm.startPrank(tutor);
        uint256 courseId = eduPay.createCourse("Solidity 101", "desc");
        eduPay.toggleCourse(courseId);
        vm.stopPrank();

        (,,, bool isActive,,) = eduPay.courses(courseId);
        assertFalse(isActive);
    }
}
