import hre from "hardhat";
const { ethers } = hre;
import { expect } from "chai";
import { BigNumber, ethers } from "ethers";
import { time } from "@openzeppelin/test-helpers";
import { FrogFund, MyToken } from "../typechain-types/index";

describe("FrogFund", function () {
  let frogFund: FrogFund;
  let token: MyToken;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;
  let addr4: any;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = (await Token.deploy(1000000)) as MyToken;

    const FrogFund = await ethers.getContractFactory("FrogFund");
    frogFund = (await FrogFund.deploy(token.target)) as FrogFund;

    await token.transfer(addr1.address, ethers.parseUnits("1000", 18));
    await token.transfer(addr2.address, ethers.parseUnits("1000", 18));
    await token.transfer(addr3.address, ethers.parseUnits("1000", 18));

    await token.approve(frogFund.target, ethers.parseUnits("100000", 18));
    await token.transfer(frogFund.target, ethers.parseUnits("10000", 18));
  });

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
      await expect(
        frogFund
          .connect(addr1)
          .createProject(title, description, link, goalAmount, deadline)
      ).to.be.revertedWith("Goal amount must be greater than 0");
    });
  });

  describe("supportProject", function () {
    it("Should allow users to support a project WithToken", async function () {
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
      await token
        .connect(addr2)
        .approve(await frogFund.getAddress(), supportAmount);
      await frogFund.connect(addr2).supportProjectWithToken(0, supportAmount);

      const project = await frogFund.projects(0);
      expect(project.currentAmount).to.equal(supportAmount);
    });

    it("Should support a project with ETH", async function () {
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

      const projectId = 0;
      const supportAmount = ethers.parseEther("1");
      await expect(
        frogFund
          .connect(addr2)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr2.address, supportAmount, true);

      const project = await frogFund.projects(projectId);
      expect(project.currentAmount).to.equal(supportAmount);

      const contribution = await frogFund.ethContributions(
        projectId,
        addr2.address
      );
      expect(contribution).to.equal(supportAmount);
    });
  });

  describe("updateProgress", function () {
    beforeEach(async function () {
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
    });

    it("Should allow the creator to update project progress to 30%", async function () {
      const progress = 30;
      const details = "Project is 30% completed";
      await frogFund.connect(addr1).updateProgress(0, progress, details);

      const project = await frogFund.projects(0);
      expect(project.currentProgress).to.equal(progress);
      expect(await frogFund.progressDetails(0, progress)).to.equal(details);
    });

    it("Should allow the creator to update project progress to 50%", async function () {
      const progress = 50;
      const details = "Project is 50% completed";
      await frogFund.connect(addr1).updateProgress(0, progress, details);

      const project = await frogFund.projects(0);
      expect(project.currentProgress).to.equal(progress);
      expect(await frogFund.progressDetails(0, progress)).to.equal(details);
    });

    it("Should allow the creator to update project progress to 70%", async function () {
      const progress = 70;
      const details = "Project is 70% completed";
      await frogFund.connect(addr1).updateProgress(0, progress, details);

      const project = await frogFund.projects(0);
      expect(project.currentProgress).to.equal(progress);
      expect(await frogFund.progressDetails(0, progress)).to.equal(details);
    });

    it("Should allow the creator to update project progress to 100%", async function () {
      const progress = 100;
      const details = "Project is 100% completed";
      await frogFund.connect(addr1).updateProgress(0, progress, details);
      const project = await frogFund.projects(0);
      expect(project.currentProgress).to.equal(progress);
      expect(await frogFund.progressDetails(0, progress)).to.equal(details);
    });
  });

  describe("reviewProgress", function () {
    async function createProject() {
      time.advanceBlock();
      const title = "Project Title";
      const description = "Project Description";
      const link = "http://project-link.com";
      const goalAmount = ethers.parseUnits("300", 18);
      const deadline = (await time.latest())
        .add(time.duration.days(10))
        .toNumber();
      await frogFund
        .connect(addr1)
        .createProject(title, description, link, goalAmount, deadline);
    }

    async function supportProject(support?: number) {
      const projectId = 0;
      const supportAmount = support ? support : ethers.parseUnits("500", 18);
      await expect(
        frogFund
          .connect(addr2)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr2.address, supportAmount, true);
    }

    async function approveProgress(progress, details, comment) {
      await frogFund.connect(addr1).updateProgress(0, progress, details);
      const approved = true;

      const transferAmount = ethers.parseUnits("1234", 18);
      await token.transfer(frogFund.target, transferAmount);
      await frogFund
        .connect(addr2)
        .reviewProgress(0, progress, comment, approved);

      expect(await frogFund.approvalComments(0, progress)).to.equal(comment);

      const creatorBalanceEth = await frogFund.getCreatorEthBalance(
        addr1.address
      );
      const goalAmount = ethers.parseUnits("300", 18);
      console.log("当前进度:", progress);
      expect(Number(ethers.formatUnits(creatorBalanceEth, 18))).to.equal(
        (Number(ethers.formatUnits(goalAmount, 18)) * progress) / 100
      );
    }

    async function disapproveProgress(progress, details, comment) {
      await frogFund.connect(addr1).updateProgress(0, progress, details);
      const approved = false;
      await frogFund
        .connect(addr2)
        .reviewProgress(0, progress, comment, approved);
      expect(await frogFund.approvalComments(0, progress)).to.equal(comment);

      const project = await frogFund.projects(0);
      const expectedProgress = progress == 30 ? 0 : progress - 20;
      expect(project.currentProgress).to.equal(expectedProgress);
    }

    before(async () => {});

    beforeEach(async () => {
      await createProject();
      //   await supportProject();
    });

    it("Should allow owner to approve project progress from 30% to 100%", async function () {
      await supportProject();
      await approveProgress(30, "Project is 30% completed", "Looks good");
      await approveProgress(50, "Project is 50% completed", "Looks good");
      await approveProgress(70, "Project is 70% completed", "Looks good");
      await approveProgress(100, "Project is 100% completed", "Looks good");
    });

    it("Should disapprove and revert project progress if disapprovals exceed half", async function () {
      const projectId = 0;
      const supportAmount = ethers.parseUnits("100", 18);
      // 2号投资
      await expect(
        frogFund
          .connect(addr2)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr2.address, supportAmount, true);
      // 3号投资
      await expect(
        frogFund
          .connect(addr3)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr3.address, supportAmount, true);

      // 4号投资
      await expect(
        frogFund
          .connect(addr4)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr4.address, supportAmount, true);

      await frogFund
        .connect(addr1)
        .updateProgress(0, 30, "Project is 30% completed");
      console.log((await frogFund.projects(0)).currentAmount, "###");
      await frogFund.connect(addr2).reviewProgress(0, 30, "ok done", false);
      await frogFund.connect(addr3).reviewProgress(0, 30, "ok done", false);
      
    //   await frogFund.connect(addr4).reviewProgress(0, 30, "ok done", true);

      const project = await frogFund.projects(0);
      console.log(project.amountDistributed);
      //   半数驳回，进度回到0
      expect(project.currentProgress).to.equal(0);
    });
    it("Should disapprove and revert project progress if approvals exceed half", async function () {
      const projectId = 0;
      const supportAmount = ethers.parseUnits("100", 18);
      // 2号投资
      await expect(
        frogFund
          .connect(addr2)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr2.address, supportAmount, true);
        console.log(ethers.formatEther(await frogFund.ethContributions(0,addr2.address)), "2号投资后");
        
      // 3号投资
      await expect(
        frogFund
          .connect(addr3)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr3.address, supportAmount, true);
  console.log(ethers.formatEther(await frogFund.ethContributions(0,addr2.address)), "3号投资后");
      // 4号投资
      await expect(
        frogFund
          .connect(addr4)
          .supportProjectWithEth(projectId, { value: supportAmount })
      )
        .to.emit(frogFund, "ProjectFunded")
        .withArgs(projectId, addr4.address, supportAmount, true);
    console.log(ethers.formatEther(await frogFund.ethContributions(0,addr2.address)), "4号投资后");
      await frogFund
        .connect(addr1)
        .updateProgress(0, 30, "Project is 30% completed");
      console.log((await frogFund.projects(0)).currentAmount, "###");
      await frogFund.connect(addr2).reviewProgress(0, 30, "ok done", true);
      await frogFund.connect(addr3).reviewProgress(0, 30, "ok done", true);
      await frogFund.connect(addr4).reviewProgress(0, 30, "ok done", true);
      console.log(
        await frogFund.connect(addr1).canSubmitNextProgress(0),
        "能否提交"
      );
       console.log(ethers.formatEther(await token.balanceOf(addr2.address)),'@@@wwwww');
      console.log(ethers.formatEther(await token.balanceOf(addr3.address)),'@@@wwwww');
      console.log(ethers.formatEther(await token.balanceOf(addr4.address)),'@@@wwwww');
      const project = await frogFund.projects(0);
      const ethContributions = await frogFund.ethContributions(0,addr2);
      const projectInvestors = await frogFund.getInvestors(0)
    //   console.log(project.amountDistributed);
    //   console.log(ethers.formatEther(ethContributions),'wwwww');
    //   console.log(projectInvestors,'wwwww');
   
      // 半数通过，发放奖励+资金

    //   验证资金到账
      expect(project.amountDistributed).to.equal(ethers.parseEther("90"));
    //   验证奖励到账
    const token2 = ethers.formatEther(await token.balanceOf(addr2.address))
    const token3 = ethers.formatEther(await token.balanceOf(addr3.address))
    const token4 = ethers.formatEther(await token.balanceOf(addr4.address))
    console.log(token2);
    expect(Number(token2)).to.equal(1001);
    });
  });
});
