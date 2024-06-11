import hre from "hardhat";
const { ethers } = hre;
import { expect } from "chai";
import { BigNumber } from "ethers";
import { time } from "@openzeppelin/test-helpers";
import { FrogFund, MyToken } from "../typechain-types/index";

describe("FrogFund", function () {
  let frogFund: FrogFund;
  let token: MyToken;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // 已部署 不需要下列代码

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    const Token = await ethers.getContractFactory("MyToken");
    token = (await Token.deploy(1000000)) as MyToken; // Initial supply: 1,000,000 tokens
    console.log("Token deployed to:", token.target);

    const FrogFund = await ethers.getContractFactory("FrogFund");
    frogFund = (await FrogFund.deploy(token.target)) as FrogFund;

    console.log("frogFund deployed to:", frogFund.target);
    // console.log(ethers.parseUnits("1000000", 18),'@@@')
    // await token.deployed();
    // const MyToken = await ethers.getContractFactory("MyToken");
    // myToken = await MyToken.attach("xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")  as MyToken;
    // const FrogFund = await ethers.getContractFactory("FrogFund");
    // frogFund = await FrogFund.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")  as FrogFund;

    // Distribute tokens

    const res1 = await token.transfer(
      addr1.address,
      ethers.parseUnits("1000", 18)
    );
    const res2 = await token.transfer(
      addr2.address,
      ethers.parseUnits("1000", 18)
    );
    // console.log(res1,res2);
  });
  // 创建项目
  describe("createProject", function () {
    it("Should create a new project", async function () {
      const goalAmount = ethers.parseUnits("500", 18);
      time.advanceBlock();
      const now = await time.latest();
      const deadline = now + time.duration.days(7).toNumber();
      const title = "Project Title";
      const description = "Project Description";
      const link = "http://project-link.com";
      await frogFund
        .connect(addr1)
        .createProject(title, description, link, goalAmount, deadline);
      const project = await frogFund.projects(0);

      expect(project.creator).to.equal(addr1.address);
      expect(project.goalAmount).to.equal(goalAmount);
      expect(project.currentAmount).to.equal(0);
      expect(project.deadline).to.equal(deadline);
      expect(project.completed).to.equal(false);
      expect(project.currentProgress).to.equal(0);
    });
    it("Should fail if goal amount is zero", async function () {
      const title = "Project Title";
      const description = "Project Description";
      const link = "http://project-link.com";
      const goalAmount = 0;
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 未来一天
      console.log(deadline, "@@@");
      await expect(
        frogFund
          .connect(addr1)
          .createProject(title, description, link, goalAmount, deadline)
      ).to.be.revertedWith("Goal amount must be greater than 0");
    });
  });

  //   // 赞助项目
  describe("supportProject", function () {
    it("Should allow users to support a project", async function () {
      time.advanceBlock();
      const title = "Project Title";
      const description = "Project Description";
      const link = "http://project-link.com";
      const goalAmount = ethers.parseUnits("500", 18);
      const deadline = (await time.latest())
        .add(time.duration.days(7))
        .toNumber();

      await frogFund
        .connect(addr1)
        .createProject(title, description, link, goalAmount, deadline);

      const supportAmount = ethers.parseUnits("100", 18);
      console.log(`授权 token 转移...`);
      await token
        .connect(addr2)
        .approve(await frogFund.getAddress(), supportAmount);
      console.log(`开始赞助project...`);
      await frogFund.connect(addr2).supportProject(0, supportAmount);

      const project = await frogFund.projects(0);
      expect(project.currentAmount).to.equal(supportAmount);
    });
  });

  //   // 更新进度
  //   describe("updateProgress", function () {
  //     it("Should allow project creator to update progress", async function () {
  //       const goalAmount = ethers.parseUnits("500", 18);
  //       const deadline = (await time.latest()) + time.duration.days(7).toNumber();

  //       await frogFund.connect(addr1).createProject(goalAmount, deadline);

  //       await frogFund.connect(addr1).updateProgress(0, 30, "Project 30% completed");
  //       const project = await frogFund.projects(0);
  //       expect(project.currentProgress).to.equal(30);
  //       expect(await frogFund.progressDetails(0)).to.equal("Project 30% completed");
  //     });
  //   });
  //   // 审批进度
  //   describe("reviewProgress", function () {
  //     it("Should allow owner to review and approve progress", async function () {
  //       const goalAmount = ethers.parseUnits("500", 18);
  //       const deadline = (await time.latest()) + time.duration.days(7).toNumber();

  //       await frogFund.connect(addr1).createProject(goalAmount, deadline);

  //       await frogFund.connect(addr1).updateProgress(0, 30, "Project 30% completed");

  //       await frogFund.connect(owner).reviewProgress(0, "Looks good", true);
  //       const project = await frogFund.projects(0);
  //       const expectedDistribution = goalAmount.mul(30).div(100);
  //       expect(await token.balanceOf(addr1.address)).to.equal(expectedDistribution.add(ethers.parseUnits("1000", 18)));
  //     });

  //     it("Should allow owner to review and reject progress", async function () {
  //       const goalAmount = ethers.parseUnits("500", 18);
  //       const deadline = (await time.latest()) + time.duration.days(7).toNumber();

  //       await frogFund.connect(addr1).createProject(goalAmount, deadline);

  //       await frogFund.connect(addr1).updateProgress(0, 30, "Project 30% completed");

  //       await frogFund.connect(owner).reviewProgress(0, "Needs more work", false);
  //       const project = await frogFund.projects(0);
  //       expect(project.currentProgress).to.equal(0);
  //     });
  //   });
  //     // 发放资金
  //   describe("distributeFunds", function () {
  //     it("Should distribute funds to the project creator", async function () {
  //       const goalAmount = ethers.parseUnits("500", 18);
  //       const deadline = (await time.latest()) + time.duration.days(7).toNumber();

  //       await frogFund.connect(addr1).createProject(goalAmount, deadline);

  //       const supportAmount = ethers.parseUnits("500", 18);
  //       await token.connect(addr2).approve(frogFund.address, supportAmount);
  //       await frogFund.connect(addr2).supportProject(0, supportAmount);

  //       await time.increaseTo(deadline + time.duration.days(1).toNumber());

  //       await frogFund.connect(owner).distributeFunds(0);
  //       const project = await frogFund.projects(0);
  //       expect(await token.balanceOf(addr1.address)).to.equal(supportAmount.add(ethers.parseUnits("1000", 18)));
  //     });

  //     it("Should refund supporters if goal not met", async function () {
  //       const goalAmount = ethers.parseUnits("500", 18);
  //       const deadline = (await time.latest()) + time.duration.days(7).toNumber();

  //       await frogFund.connect(addr1).createProject(goalAmount, deadline);

  //       const supportAmount = ethers.parseUnits("100", 18);
  //       await token.connect(addr2).approve(frogFund.address, supportAmount);
  //       await frogFund.connect(addr2).supportProject(0, supportAmount);

  //       await time.increaseTo(deadline + time.duration.days(1).toNumber());

  //       await frogFund.connect(owner).distributeFunds(0);
  //       const project = await frogFund.projects(0);
  //       expect(await token.balanceOf(addr2.address)).to.equal(supportAmount);
  //     });
  //   });
});
