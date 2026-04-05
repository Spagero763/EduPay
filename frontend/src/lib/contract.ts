export const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"

export const EDUPAY_ABI = [
  "function createCourse(string memory _title, string memory _description) external returns (uint256)",
  "function addChapter(uint256 _courseId, string memory _title, string memory _contentHash, uint256 _price) external returns (uint256)",
  "function purchaseChapter(uint256 _courseId, uint256 _chapterId) external",
  "function purchaseFullCourse(uint256 _courseId) external",
  "function checkAccess(uint256 _courseId, uint256 _chapterId, address _student) external view returns (bool)",
  "function getChapterContent(uint256 _courseId, uint256 _chapterId) external view returns (string memory)",
  "function getChapter(uint256 _courseId, uint256 _chapterId) external view returns (string memory title, uint256 price, bool purchased)",
  "function getTutorCourses(address _tutor) external view returns (uint256[])",
  "function getFullCoursePrice(uint256 _courseId, address _student) external view returns (uint256)",
  "function accruedFees() external view returns (uint256)",
  "function courseCount() external view returns (uint256)",
  "function courses(uint256) external view returns (address tutor, string memory title, string memory description, bool isActive, uint256 chapterCount, uint256 totalEarned)",
  "function tutorEarnings(address) external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "event CourseCreated(uint256 indexed courseId, address indexed tutor, string title)",
  "event ChapterPurchased(uint256 indexed courseId, uint256 indexed chapterId, address indexed student, uint256 amountPaid)",
] as const

export const CUSD_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
] as const

export const CELO_CHAIN_ID = 42220
