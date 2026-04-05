// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract EduPay {
    // ── Accepted payment tokens ───────────────────────
    // cUSD  (Mento)  — 18 decimals
    address public constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    // USDC  (Circle) — 6 decimals
    address public constant USDC = 0xcebA9300f2b948710d2653dD7B07f33A8B32118C;

    address public owner;
    uint256 public platformFeePercent;
    uint256 public courseCount;

    struct Chapter {
        string title;
        string contentHash;
        uint256 priceUSD; // stored in 6 decimals (USDC base)
        bool exists;
    }

    struct Course {
        address tutor;
        string title;
        string description;
        bool isActive;
        uint256 chapterCount;
        uint256 totalEarned; // in 6 decimals
    }

    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(uint256 => Chapter)) public chapters;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public hasAccess;
    mapping(address => uint256[]) public tutorCourses;
    mapping(address => uint256) public tutorEarnings;

    // track fees per token
    mapping(address => uint256) public accruedTokenFees;

    event CourseCreated(uint256 indexed courseId, address indexed tutor, string title);
    event ChapterAdded(uint256 indexed courseId, uint256 indexed chapterId, string title, uint256 price);
    event ChapterPurchased(
        uint256 indexed courseId, uint256 indexed chapterId, address indexed student, address token, uint256 amountPaid
    );
    event FullCoursePurchased(uint256 indexed courseId, address indexed student, address token, uint256 totalPaid);
    event CourseToggled(uint256 indexed courseId, bool isActive);
    event FeesWithdrawn(address token, address indexed to, uint256 amount);
    event PlatformFeeUpdated(uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "EduPay: not owner");
        _;
    }

    modifier courseExists(uint256 _courseId) {
        require(_courseId < courseCount, "EduPay: course not found");
        _;
    }

    modifier onlyTutor(uint256 _courseId) {
        require(courses[_courseId].tutor == msg.sender, "EduPay: not your course");
        _;
    }

    modifier validToken(address _token) {
        require(_token == CUSD || _token == USDC, "EduPay: unsupported token");
        _;
    }

    constructor() {
        owner = msg.sender;
        platformFeePercent = 5;
    }

    // ── Internal helpers ──────────────────────────────

    /**
     * @dev Convert a price stored in 6-decimal base to the
     *      correct amount for the chosen token.
     *      cUSD has 18 decimals, USDC has 6 decimals.
     */
    function _toTokenAmount(uint256 _price6, address _token) internal pure returns (uint256) {
        if (_token == CUSD) {
            return _price6 * 1e12; // scale 6 → 18 decimals
        }
        return _price6; // USDC stays at 6 decimals
    }

    // ── Tutor functions ───────────────────────────────

    function createCourse(string memory _title, string memory _description) external returns (uint256 courseId) {
        require(bytes(_title).length > 0, "EduPay: empty title");
        courseId = courseCount++;
        courses[courseId] = Course({
            tutor: msg.sender, title: _title, description: _description, isActive: true, chapterCount: 0, totalEarned: 0
        });
        tutorCourses[msg.sender].push(courseId);
        emit CourseCreated(courseId, msg.sender, _title);
    }

    /**
     * @param _price  Price in USDC units (6 decimals).
     *                e.g. 1 USD = 1_000_000
     *                     0.50 USD = 500_000
     */
    function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price)
        external
        courseExists(_courseId)
        onlyTutor(_courseId)
        returns (uint256 chapterId)
    {
        require(bytes(_title).length > 0, "EduPay: empty title");
        require(bytes(_contentHash).length > 0, "EduPay: empty hash");
        require(_price > 0, "EduPay: zero price");
        require(courses[_courseId].isActive, "EduPay: course inactive");

        chapterId = courses[_courseId].chapterCount++;
        chapters[_courseId][chapterId] =
            Chapter({title: _title, contentHash: _contentHash, priceUSD: _price, exists: true});
        emit ChapterAdded(_courseId, chapterId, _title, _price);
    }

    function updateChapter(uint256 _courseId, uint256 _chapterId, string memory _newContentHash, uint256 _newPrice)
        external
        courseExists(_courseId)
        onlyTutor(_courseId)
    {
        require(_chapterId < courses[_courseId].chapterCount, "EduPay: chapter not found");
        require(_newPrice > 0, "EduPay: zero price");
        if (bytes(_newContentHash).length > 0) {
            chapters[_courseId][_chapterId].contentHash = _newContentHash;
        }
        chapters[_courseId][_chapterId].priceUSD = _newPrice;
    }

    function toggleCourse(uint256 _courseId) external courseExists(_courseId) onlyTutor(_courseId) {
        courses[_courseId].isActive = !courses[_courseId].isActive;
        emit CourseToggled(_courseId, courses[_courseId].isActive);
    }

    // ── Student functions ─────────────────────────────

    /**
     * @param _token  CUSD or USDC address
     */
    function purchaseChapter(uint256 _courseId, uint256 _chapterId, address _token)
        external
        courseExists(_courseId)
        validToken(_token)
    {
        Course storage course = courses[_courseId];
        Chapter storage chapter = chapters[_courseId][_chapterId];

        require(course.isActive, "EduPay: course inactive");
        require(chapter.exists, "EduPay: chapter not found");
        require(!hasAccess[_courseId][msg.sender][_chapterId], "EduPay: already purchased");

        uint256 amount = _toTokenAmount(chapter.priceUSD, _token);
        uint256 fee = (amount * platformFeePercent) / 100;
        uint256 tutorShare = amount - fee;

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), amount), "EduPay: transfer failed");
        require(token.transfer(course.tutor, tutorShare), "EduPay: tutor pay failed");

        accruedTokenFees[_token] += fee;
        hasAccess[_courseId][msg.sender][_chapterId] = true;
        course.totalEarned += chapter.priceUSD;
        tutorEarnings[course.tutor] += chapter.priceUSD;

        emit ChapterPurchased(_courseId, _chapterId, msg.sender, _token, amount);
    }

    function purchaseFullCourse(uint256 _courseId, address _token) external courseExists(_courseId) validToken(_token) {
        Course storage course = courses[_courseId];
        require(course.isActive, "EduPay: course inactive");
        require(course.chapterCount > 0, "EduPay: no chapters");

        uint256 totalPrice6;
        for (uint256 i = 0; i < course.chapterCount; i++) {
            if (!hasAccess[_courseId][msg.sender][i]) {
                totalPrice6 += chapters[_courseId][i].priceUSD;
            }
        }
        require(totalPrice6 > 0, "EduPay: all purchased");

        uint256 totalAmount = _toTokenAmount(totalPrice6, _token);
        uint256 fee = (totalAmount * platformFeePercent) / 100;
        uint256 tutorShare = totalAmount - fee;

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), totalAmount), "EduPay: transfer failed");
        require(token.transfer(course.tutor, tutorShare), "EduPay: tutor pay failed");

        accruedTokenFees[_token] += fee;

        for (uint256 i = 0; i < course.chapterCount; i++) {
            hasAccess[_courseId][msg.sender][i] = true;
        }

        course.totalEarned += totalPrice6;
        tutorEarnings[course.tutor] += totalPrice6;

        emit FullCoursePurchased(_courseId, msg.sender, _token, totalAmount);
    }

    // ── Views ─────────────────────────────────────────

    function checkAccess(uint256 _courseId, uint256 _chapterId, address _student) external view returns (bool) {
        return hasAccess[_courseId][_student][_chapterId];
    }

    function getChapterContent(uint256 _courseId, uint256 _chapterId) external view returns (string memory) {
        require(hasAccess[_courseId][msg.sender][_chapterId], "EduPay: no access");
        return chapters[_courseId][_chapterId].contentHash;
    }

    function getChapter(uint256 _courseId, uint256 _chapterId)
        external
        view
        returns (string memory title, uint256 priceUSD, bool purchased)
    {
        Chapter storage c = chapters[_courseId][_chapterId];
        require(c.exists, "EduPay: not found");
        return (c.title, c.priceUSD, hasAccess[_courseId][msg.sender][_chapterId]);
    }

    function getTutorCourses(address _tutor) external view returns (uint256[] memory) {
        return tutorCourses[_tutor];
    }

    function getFullCoursePrice(uint256 _courseId, address _student)
        external
        view
        courseExists(_courseId)
        returns (uint256 totalUSD)
    {
        Course storage course = courses[_courseId];
        for (uint256 i = 0; i < course.chapterCount; i++) {
            if (!hasAccess[_courseId][_student][i]) {
                totalUSD += chapters[_courseId][i].priceUSD;
            }
        }
    }

    // ── Admin ─────────────────────────────────────────

    function withdrawFees(address _token) external onlyOwner validToken(_token) {
        uint256 bal = accruedTokenFees[_token];
        require(bal > 0, "EduPay: no fees");
        accruedTokenFees[_token] = 0;
        require(IERC20(_token).transfer(owner, bal), "EduPay: withdraw failed");
        emit FeesWithdrawn(_token, owner, bal);
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 10, "EduPay: max 10%");
        platformFeePercent = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "EduPay: zero address");
        owner = _newOwner;
    }
}
