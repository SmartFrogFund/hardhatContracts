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
        uint256 amountDistributed; // 已发放金额
        uint256 deadline; // 截止日期
        bool completed; // 项目状态
        uint256 currentProgress; // 0, 30, 50, 70, 100 项目进度
    }

    IERC20 public token;
    uint256 public projectCount = 0;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => uint256)) public ethContributions;
    mapping(uint256 => mapping(uint256 => string)) public progressDetails; // projectId => progress => details
    mapping(uint256 => mapping(uint256 => string)) public approvalComments; // projectId => progress => comment
    mapping(address => uint256) public creatorBalances; // 记录每个项目发起人的ERC20余额
    mapping(address => uint256) public creatorEthBalances; // 记录每个项目发起人的ETH余额
    mapping(uint256 => address[]) public projectInvestors; // 记录每个项目的投资者

    mapping(uint256 => mapping(uint256 => uint256)) public progressApprovals; // projectId => progress => approval count
    mapping(uint256 => mapping(uint256 => uint256)) public progressDisapprovals; // projectId => progress => disapproval count

    modifier onlyInvestor(uint256 _projectId) {
        require(
            ethContributions[_projectId][msg.sender] > 0 ||
                contributions[_projectId][msg.sender] > 0,
            "Caller is not an investor"
        );
        _;
    }
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string _description,
        string _link,
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
            currentProgress: 0,
            amountDistributed: 0
        });

        emit ProjectCreated(
            projectCount,
            msg.sender,
            _description,
            _link,
            _goalAmount,
            _deadline
        );
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

        if (contributions[_projectId][msg.sender] == _amount) {
            // 新增投资者
            projectInvestors[_projectId].push(msg.sender);
        }

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

        if (ethContributions[_projectId][msg.sender] == msg.value) {
            // 新增投资者
            projectInvestors[_projectId].push(msg.sender);
        }
        if (project.currentAmount >= project.goalAmount) {
            // 达到目标金额
            project.completed = true;
        }

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
        if (project.currentProgress > 0) {
            uint256 totalInvestors = projectInvestors[_projectId].length;
            uint256 requiredApprovals = getRequiredApprovals(totalInvestors);
            require(
                progressApprovals[_projectId][project.currentProgress] >=
                    requiredApprovals,
                "Current progress has not been approved by the majority of investors"
            );
        }

        project.currentProgress = _progress;
        progressDetails[_projectId][_progress] = _details;

        emit ProgressUpdated(_projectId, _progress, _details);
    }

    function reviewProgress(
        uint256 _projectId,
        uint256 _progress,
        string calldata _comment,
        bool _approved
    ) external onlyInvestor(_projectId) {
        Project storage project = projects[_projectId];
        require(
            project.currentProgress == _progress,
            "Progress does not match current project progress"
        );
        require(
            project.currentAmount >= project.goalAmount,
            "Project has not reached goal amount"
        );

        approvalComments[_projectId][_progress] = _comment;

        uint256 totalInvestors = projectInvestors[_projectId].length;
        uint256 requiredApprovals = getRequiredApprovals(totalInvestors);

        if (_approved) {
            progressApprovals[_projectId][_progress]++;
            if (progressApprovals[_projectId][_progress] >= requiredApprovals) {
                distributeFunds(_projectId, _progress, project);
            }
            distributeRewards(_projectId, project, msg.sender);
        } else {
            progressDisapprovals[_projectId][_progress]++;
            if (
                progressDisapprovals[_projectId][_progress] > totalInvestors / 2
            ) {
                // 回退进度
                project.currentProgress = _progress == 30
                    ? 0
                    : project.currentProgress - 20;
                // 清空之前阶段的审批记录
                clearProgressRecords(_projectId, _progress);
            }
        }
        emit ProgressReviewed(_projectId, _comment, _approved);
    }
    function clearProgressRecords(
        uint256 _projectId,
        uint256 _progress
    ) internal {
        progressApprovals[_projectId][_progress] = 0;
        progressDisapprovals[_projectId][_progress] = 0;
    }
    function getRequiredApprovals(
        uint256 totalInvestors
    ) internal pure returns (uint256) {
        return (totalInvestors + 1) / 2; // 确保至少达到总投资人数的一半
    }
    function distributeFunds(
        uint256 _projectId,
        uint256 _progress,
        Project storage project
    ) internal {
        uint256 totalAmountToDistribute = (project.goalAmount * _progress) /
            100;
        uint256 amountToDistribute = totalAmountToDistribute -
            project.amountDistributed;

        if (amountToDistribute > 0) {
            project.amountDistributed += amountToDistribute; // 更新已发放金额
            creatorEthBalances[project.creator] += amountToDistribute; // 更新发起人ETH余额
            // 实际转移ETH到项目发起人
            bool success = project.creator.send(amountToDistribute);
            require(success, "ETH transfer failed");

            emit FundsDistributed(_projectId, amountToDistribute, false);
        }
    }

    function distributeRewards(
        uint256 _projectId,
        Project storage project,
        address caller
    ) internal {
        uint256 reward = 1 * 10 ** 18; // 设置奖励数额
        // token.approve(address(this), reward);
        address[] memory investors = projectInvestors[_projectId];
        // for (uint256 i = 0; i < investors.length; i++) {
        // address investor = investors[i];
        require(ethContributions[_projectId][msg.sender] > 0, "no amount");
        if (ethContributions[_projectId][msg.sender] > 0) {
            require(
                token.transfer(msg.sender, reward),
                "Investor reward transfer failed"
            );
        }
        // }
        require(
            token.transfer(project.creator, reward),
            "Creator reward transfer failed"
        );
        creatorBalances[project.creator] += reward; // 更新发起人ERC20余额
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
        returns (address, uint256, uint256, uint256, bool, uint256, uint256)
    {
        Project storage project = projects[_projectId];
        return (
            project.creator,
            project.goalAmount,
            project.currentAmount,
            project.deadline,
            project.completed,
            project.currentProgress,
            project.amountDistributed
        );
    }

    function getPlatformBalance(
        address _user
    ) external view returns (uint256, uint256) {
        uint256 totalTokenBalance = 0;
        uint256 totalEthBalance = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            totalTokenBalance += contributions[i][_user];
            totalEthBalance += ethContributions[i][_user];
        }
        return (totalTokenBalance, totalEthBalance);
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
    function transferTokens(address to, uint256 value) external returns (bool) {
        return token.transfer(to, value);
    }
    function canSubmitNextProgress(
        uint256 _projectId
    ) external view returns (bool) {
        Project storage project = projects[_projectId];
        uint256 totalInvestors = projectInvestors[_projectId].length;
        uint256 requiredApprovals = getRequiredApprovals(totalInvestors);

        if (project.currentProgress == 0) {
            return true;
        }

        return
            progressApprovals[_projectId][project.currentProgress] >=
            requiredApprovals;
    }
    function getInvestors(
        uint256 projectId
    ) public view returns (address[] memory) {
        return projectInvestors[projectId];
    }
}
