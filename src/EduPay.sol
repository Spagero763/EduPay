// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract EduPay {
    IERC20 public immutable cUSD;
    address public owner;
    uint256 public platformFeePercent;
    uint256 public courseCount;

    struct Chapter {
        string title;
        string contentHash;
        uint256 price;
        bool exists;
    }

    struct Course {
        address tutor;
        string title;
        string description;
        bool isActive;
        uint256 chapterCount;
        uint256 totalEarned;
    }

    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(uint256 => Chapter)) public chapters;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public hasAccess;
    mapping(address => uint256[]) public tutorCourses;
    mapping(address => uint256) public tutorEarnings;

    event CourseCreated(uint256 indexed courseId, address indexed tutor, string title);
    event ChapterAdded(uint256 indexed courseId, uint256 indexed chapterId, string title, uint256 price);
    event ChapterPurchased(
        uint256 indexed courseId, uint256 indexed chapterId, address indexed student, uint256 amountPaid
    );
    event FullCoursePurchased(uint256 indexed courseId, address indexed student, uint256 totalPaid);
    event CourseToggled(uint256 indexed courseId, bool isActive);
    event FeesWithdrawn(address indexed to, uint256 amount);
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

    constructor(address _cUSD) {
        require(_cUSD != address(0), "EduPay: invalid cUSD");
        cUSD = IERC20(_cUSD);
        owner = msg.sender;
        platformFeePercent = 5;
    }

    // ── Tutor ─────────────────────────────────────────────────

    function createCourse(string memory _title, string memory _description) external returns (uint256 courseId) {
        require(bytes(_title).length > 0, "EduPay: empty title");
        courseId = courseCount++;
        courses[courseId] = Course({
            tutor: msg.sender, title: _title, description: _description, isActive: true, chapterCount: 0, totalEarned: 0
        });
        tutorCourses[msg.sender].push(courseId);
        emit CourseCreated(courseId, msg.sender, _title);
    }

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
            Chapter({title: _title, contentHash: _contentHash, price: _price, exists: true});
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
        chapters[_courseId][_chapterId].price = _newPrice;
    }

    function toggleCourse(uint256 _courseId) external courseExists(_courseId) onlyTutor(_courseId) {
        courses[_courseId].isActive = !courses[_courseId].isActive;
        emit CourseToggled(_courseId, courses[_courseId].isActive);
    }

    // ── Student ───────────────────────────────────────────────

    function purchaseChapter(uint256 _courseId, uint256 _chapterId) external courseExists(_courseId) {
        Course storage course = courses[_courseId];
        Chapter storage chapter = chapters[_courseId][_chapterId];

        require(course.isActive, "EduPay: course inactive");
        require(chapter.exists, "EduPay: chapter not found");
        require(!hasAccess[_courseId][msg.sender][_chapterId], "EduPay: already purchased");

        uint256 price = chapter.price;
        uint256 fee = (price * platformFeePercent) / 100;
        uint256 tutorShare = price - fee;

        require(cUSD.transferFrom(msg.sender, address(this), price), "EduPay: transfer failed");
        require(cUSD.transfer(course.tutor, tutorShare), "EduPay: tutor pay failed");

        hasAccess[_courseId][msg.sender][_chapterId] = true;
        course.totalEarned += tutorShare;
        tutorEarnings[course.tutor] += tutorShare;

        emit ChapterPurchased(_courseId, _chapterId, msg.sender, price);
    }

    function purchaseFullCourse(uint256 _courseId) external courseExists(_courseId) {
        Course storage course = courses[_courseId];
        require(course.isActive, "EduPay: course inactive");
        require(course.chapterCount > 0, "EduPay: no chapters");

        uint256 totalCost;
        for (uint256 i = 0; i < course.chapterCount; i++) {
            if (!hasAccess[_courseId][msg.sender][i]) {
                totalCost += chapters[_courseId][i].price;
            }
        }
        require(totalCost > 0, "EduPay: all purchased");

        uint256 fee = (totalCost * platformFeePercent) / 100;
        uint256 tutorShare = totalCost - fee;

        require(cUSD.transferFrom(msg.sender, address(this), totalCost), "EduPay: transfer failed");
        require(cUSD.transfer(course.tutor, tutorShare), "EduPay: tutor pay failed");

        for (uint256 i = 0; i < course.chapterCount; i++) {
            hasAccess[_courseId][msg.sender][i] = true;
        }

        course.totalEarned += tutorShare;
        tutorEarnings[course.tutor] += tutorShare;

        emit FullCoursePurchased(_courseId, msg.sender, totalCost);
    }

    // ── Views ─────────────────────────────────────────────────

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
        returns (string memory title, uint256 price, bool purchased)
    {
        Chapter storage c = chapters[_courseId][_chapterId];
        require(c.exists, "EduPay: not found");
        return (c.title, c.price, hasAccess[_courseId][msg.sender][_chapterId]);
    }

    function getTutorCourses(address _tutor) external view returns (uint256[] memory) {
        return tutorCourses[_tutor];
    }

    function getFullCoursePrice(uint256 _courseId, address _student)
        external
        view
        courseExists(_courseId)
        returns (uint256 total)
    {
        Course storage course = courses[_courseId];
        for (uint256 i = 0; i < course.chapterCount; i++) {
            if (!hasAccess[_courseId][_student][i]) {
                total += chapters[_courseId][i].price;
            }
        }
    }

    function accruedFees() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ── Admin ─────────────────────────────────────────────────

    function withdrawFees() external onlyOwner {
        uint256 bal = cUSD.balanceOf(address(this));
        require(bal > 0, "EduPay: no fees");
        require(cUSD.transfer(owner, bal), "EduPay: withdraw failed");
        emit FeesWithdrawn(owner, bal);
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
