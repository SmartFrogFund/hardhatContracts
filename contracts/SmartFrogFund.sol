// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FrogFund is Ownable {
    struct Project {
        address payable creator; // 项目发起人
        string title; // 项目标题
        string description; // 项目描述
        string link; // 项目链接
        uint256 goalAmount; // 目标筹集金额
        uint256 currentAmount; // 当前筹集金额
        uint256 deadline; // 截止日期
        bool completed; // 项目状态
        uint256 currentProgress; // 0, 30, 50, 70, 100 项目进度
    }

    IERC20 public token;
    uint256 public projectCount = 0;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => uint256)) public ethContributions;
    mapping(uint256 => string) public progressDetails;
    mapping(uint256 => string) public approvalComments;
    mapping(address => uint256) public creatorBalances; // 记录每个项目发起人的ERC20余额
    mapping(address => uint256) public creatorEthBalances; // 记录每个项目发起人的ETH余额

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        uint256 goalAmount,
        uint256 deadline
    );
    event ProjectFunded(
        uint256 indexed projectId,
        address indexed supporter,
        uint256 amount,
        bool isEth
    );
    event ProgressUpdated(
        uint256 indexed projectId,
        uint256 progress,
        string details
    );
    event FundsDistributed(
        uint256 indexed projectId,
        uint256 amount,
        bool isEth
    );
    event RefundIssued(
        uint256 indexed projectId,
        address indexed supporter,
        uint256 amount,
        bool isEth
    );
    event ProgressReviewed(
        uint256 indexed projectId,
        string comment,
        bool approved
    );

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
        transferOwnership(msg.sender);
    }
    function createProject(
        string memory _title,
        string memory _description,
        string memory _link,
        uint256 _goalAmount,
        uint256 _deadline
    ) external {
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        projects[projectCount] = Project({
            creator: payable(msg.sender),
            title: _title,
            description: _description,
            link: _link,
            goalAmount: _goalAmount,
            currentAmount: 0,
            deadline: _deadline,
            completed: false,
            currentProgress: 0
        });

        emit ProjectCreated(projectCount, msg.sender, _goalAmount, _deadline);
        projectCount++;
    }

    function supportProjectWithToken(
        uint256 _projectId,
        uint256 _amount
    ) external {
        Project storage project = projects[_projectId];
        require(
            block.timestamp < project.deadline,
            "Project funding period is over"
        );
        require(_amount > 0, "Amount must be greater than 0");
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        project.currentAmount += _amount;
        contributions[_projectId][msg.sender] += _amount;

        emit ProjectFunded(_projectId, msg.sender, _amount, false);
    }

    function supportProjectWithEth(uint256 _projectId) external payable {
        Project storage project = projects[_projectId];
        require(
            block.timestamp < project.deadline,
            "Project funding period is over"
        );
        require(msg.value > 0, "Amount must be greater than 0");

        project.currentAmount += msg.value;
        ethContributions[_projectId][msg.sender] += msg.value;

        emit ProjectFunded(_projectId, msg.sender, msg.value, true);
    }

    function updateProgress(
        uint256 _projectId,
        uint256 _progress,
        string calldata _details
    ) external {
        Project storage project = projects[_projectId];
        require(
            msg.sender == project.creator,
            "Only project creator can update progress"
        );
        require(
            _progress == 30 ||
                _progress == 50 ||
                _progress == 70 ||
                _progress == 100,
            "Invalid progress value"
        );
        require(
            _progress > project.currentProgress,
            "Progress must be greater than current progress"
        );

        project.currentProgress = _progress;
        progressDetails[_projectId] = _details;

        emit ProgressUpdated(_projectId, _progress, _details);
    }

    function reviewProgress(
        uint256 _projectId,
        string calldata _comment,
        bool _approved
    ) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.currentProgress > 0, "No progress to review");

        approvalComments[_projectId] = _comment;

        if (_approved) {
            uint256 amountToDistribute = (project.goalAmount *
                project.currentProgress) / 100;
            if (amountToDistribute > 0) {
                require(
                    token.transfer(project.creator, amountToDistribute),
                    "Token transfer failed"
                );
                creatorBalances[project.creator] += amountToDistribute; // 更新发起人ERC20余额
                emit FundsDistributed(_projectId, amountToDistribute, false);

                // 分配奖励给投资人和项目发起人
                uint256 reward = 1; // 设置奖励数额，您可以根据实际情况调整
                for (uint256 i = 0; i < projectCount; i++) {
                    address investor = projects[i].creator;
                    if (contributions[_projectId][investor] > 0) {
                        require(
                            token.transferFrom(owner(), investor, reward),
                            "Investor reward transfer failed"
                        );
                    }
                }
                require(
                    token.transferFrom(owner(), project.creator, reward),
                    "Creator reward transfer failed"
                );
            }
        } else {
            project.currentProgress = 0;
        }

        emit ProgressReviewed(_projectId, _comment, _approved);
    }

    function distributeFunds(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(
            block.timestamp >= project.deadline,
            "Project is still ongoing"
        );
        require(!project.completed, "Funds already distributed");

        if (project.currentAmount >= project.goalAmount) {
            uint256 ethBalance = address(this).balance;
            if (ethBalance > 0) {
                uint256 ethToDistribute = ethContributions[_projectId][
                    msg.sender
                ];
                if (ethToDistribute > 0) {
                    ethContributions[_projectId][msg.sender] = 0;
                    (bool success, ) = project.creator.call{value: ethToDistribute}("");
                     require(success, "Transfer failed");
                    creatorEthBalances[project.creator] += ethToDistribute; // 更新发起人ETH余额
                    emit FundsDistributed(_projectId, ethToDistribute, true);
                }
            }
        } 

        project.completed = true;
    }

    function updateProject(
        uint256 _projectId,
        uint256 _newGoalAmount,
        uint256 _newDeadline
    ) external {
        Project storage project = projects[_projectId];
        require(
            msg.sender == project.creator,
            "Only project creator can update"
        );
        require(!project.completed, "Project is already completed");

        if (_newGoalAmount > 0) {
            project.goalAmount = _newGoalAmount;
        }
        if (_newDeadline > block.timestamp) {
            project.deadline = _newDeadline;
        }
    }

    function getProjectDetails(
        uint256 _projectId
    )
        external
        view
        returns (address, uint256, uint256, uint256, bool, uint256)
    {
        Project storage project = projects[_projectId];
        return (
            project.creator,
            project.goalAmount,
            project.currentAmount,
            project.deadline,
            project.completed,
            project.currentProgress
        );
    }

    function getPlatformBalance(address _user) external view returns (uint256) {
        uint256 totalTokenBalance = 0;
        uint256 totalEthBalance = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            totalTokenBalance += contributions[i][_user];
            totalEthBalance += ethContributions[i][_user];
        }
        return totalTokenBalance + totalEthBalance;
    }

    function getCreatorBalance(
        address _creator
    ) external view returns (uint256) {
        return creatorBalances[_creator];
    }

    function getCreatorEthBalance(
        address _creator
    ) external view returns (uint256) {
        return creatorEthBalances[_creator];
    }
}
