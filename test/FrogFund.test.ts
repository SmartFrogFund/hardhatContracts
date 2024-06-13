import hre from "hardhat";
const { ethers } = hre;
import { expect } from "chai";
import { BigNumber } from "ethers";
import { time } from "@openzeppelin/test-helpers";
import { FrogFund, MyToken } from "../typechain-types/index";

describe( "FrogFund", function () {
    let frogFund: FrogFund;
    let token: MyToken;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach( async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // 已部署 不需要下列代码
        const [deployer] = await ethers.getSigners();
        // console.log("Deploying contracts with the account:", deployer.address);
        const Token = await ethers.getContractFactory( "MyToken" );
        token = ( await Token.deploy( 1000000 ) ) as MyToken; // Initial supply: 1,000,000 tokens
        // console.log("Token deployed to:", token.target);

        const FrogFund = await ethers.getContractFactory( "FrogFund" );
        frogFund = ( await FrogFund.deploy( token.target ) ) as FrogFund;

        // console.log("frogFund deployed to:", frogFund.target);

        // Distribute tokens
        await token.transfer( addr1.address, ethers.parseUnits( "1000", 18 ) );
        await token.transfer( addr2.address, ethers.parseUnits( "1000", 18 ) );

        // 授权 FrogFund 合约可以从 owner 账户中转移足够的代币
        await token.approve( frogFund.target, ethers.parseUnits( "100000", 18 ) );

        // console.log('@@@初次加载@@@', await token.balanceOf(frogFund.target));
    } );

    // 创建项目
    describe( "createProject", function () {
        it( "Should create a new project", async function () {
            const goalAmount = ethers.parseUnits( "500", 18 );
            time.advanceBlock();
            const now = await time.latest();
            const deadline = now + time.duration.days( 7 ).toNumber();
            const title = "Project Title";
            const description = "Project Description";
            const link = "http://project-link.com";
            await frogFund
                .connect( addr1 )
                .createProject( title, description, link, goalAmount, deadline );
            const project = await frogFund.projects( 0 );

            expect( project.creator ).to.equal( addr1.address );
            expect( project.goalAmount ).to.equal( goalAmount );
            expect( project.currentAmount ).to.equal( 0 );
            expect( project.deadline ).to.equal( deadline );
            expect( project.completed ).to.equal( false );
            expect( project.currentProgress ).to.equal( 0 );
        } );
        it( "Should fail if goal amount is zero", async function () {
            const title = "Project Title";
            const description = "Project Description";
            const link = "http://project-link.com";
            const goalAmount = 0;
            const deadline =
                ( await ethers.provider.getBlock( "latest" ) ).timestamp + 86400; // 未来一天
            console.log( deadline, "@@@" );
            await expect(
                frogFund
                    .connect( addr1 )
                    .createProject( title, description, link, goalAmount, deadline )
            ).to.be.revertedWith( "Goal amount must be greater than 0" );
        } );
    } );

    // 赞助项目
    describe( "supportProject", function () {
        it( "Should allow users to support a project WithToken", async function () {
            time.advanceBlock();
            const title = "Project Title";
            const description = "Project Description";
            const link = "http://project-link.com";
            const goalAmount = ethers.parseUnits( "500", 18 );
            const deadline = ( await time.latest() )
                .add( time.duration.days( 7 ) )
                .toNumber();

            await frogFund
                .connect( addr1 )
                .createProject( title, description, link, goalAmount, deadline );

            const supportAmount = ethers.parseUnits( "100", 18 );
            console.log( `授权 token 转移...` );
            await token
                .connect( addr2 )
                .approve( await frogFund.getAddress(), supportAmount );
            console.log( `开始赞助project...` );
            await frogFund.connect( addr2 ).supportProjectWithToken( 0, supportAmount );

            const project = await frogFund.projects( 0 );
            expect( project.currentAmount ).to.equal( supportAmount );
        } );

        it( "Should support a project with ETH", async function () {
            // 创建项目
            time.advanceBlock();
            const title = "Project Title";
            const description = "Project Description";
            const link = "http://project-link.com";
            const goalAmount = ethers.parseUnits( "500", 18 );
            const deadline = ( await time.latest() )
                .add( time.duration.days( 7 ) )
                .toNumber();
            await frogFund
                .connect( addr1 )
                .createProject( title, description, link, goalAmount, deadline );

            // 使用 ETH 支持项目
            const projectId = 0;
            const supportAmount = ethers.parseEther( "1" );
            await expect(
                frogFund
                    .connect( addr2 )
                    .supportProjectWithEth( projectId, { value: supportAmount } )
            )
                .to.emit( frogFund, "ProjectFunded" )
                .withArgs( projectId, addr2.address, supportAmount, true );

            // 验证项目当前金额
            const project = await frogFund.projects( projectId );
            expect( project.currentAmount ).to.equal( supportAmount );

            // 验证贡献记录
            const contribution = await frogFund.ethContributions(
                projectId,
                addr2.address
            );
            expect( contribution ).to.equal( supportAmount );
        } );
    } );

    // 更新进度
    describe( "updateProgress", function () {
        beforeEach( async function () {
            const title = "Project Title";
            const description = "Project Description";
            const link = "http://project-link.com";
            const goalAmount = ethers.parseUnits( "500", 18 );
            const deadline = ( await time.latest() )
                .add( time.duration.days( 7 ) )
                .toNumber();

            await frogFund
                .connect( addr1 )
                .createProject( title, description, link, goalAmount, deadline );
        } );
        it( "30% Should allow the creator to update project progress", async function () {
            const progress = 30;
            const details = "Project is 30% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );

            const project = await frogFund.projects( 0 );
            expect( project.currentProgress ).to.equal( progress );
            expect( await frogFund.progressDetails( 0, progress ) ).to.equal( details );
        } );
        it( "50% Should allow the creator to update project progress", async function () {
            const progress = 50;
            const details = "Project is 50% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );

            const project = await frogFund.projects( 0 );
            expect( project.currentProgress ).to.equal( progress );
            expect( await frogFund.progressDetails( 0, progress ) ).to.equal( details );
        } );
        it( "70% Should allow the creator to update project progress", async function () {
            const progress = 70;
            const details = "Project is 70% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );

            const project = await frogFund.projects( 0 );
            expect( project.currentProgress ).to.equal( progress );
            expect( await frogFund.progressDetails( 0, progress ) ).to.equal( details );
        } );
        it( "100% Should allow the creator to update project progress", async function () {
            const progress = 100;
            const details = "Project is 100% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );
            const project = await frogFund.projects( 0 );
            expect( project.currentProgress ).to.equal( progress );
            expect( await frogFund.progressDetails( 0, progress ) ).to.equal( details );
        } );
    } );

    // 审批进度
    describe("reviewProgress", function () {
    async function createProject() {
        time.advanceBlock();
        const title = "Project Title";
        const description = "Project Description";
        const link = "http://project-link.com";
        const goalAmount = ethers.parseUnits("500", 18);
        const deadline = (await time.latest()).add(time.duration.days(10)).toNumber();
        await frogFund.connect(addr1).createProject(title, description, link, goalAmount, deadline);
    }

    async function supportProject() {
        const projectId = 0;
        const supportAmount = ethers.parseUnits("500", 18);
        await expect(frogFund.connect(addr2).supportProjectWithEth(projectId, { value: supportAmount }))
            .to.emit(frogFund, "ProjectFunded")
            .withArgs(projectId, addr2.address, supportAmount, true);
    }

    async function approveProgress(progress, details, comment) {
        await frogFund.connect(addr1).updateProgress(0, progress, details);
        const approved = true;

        const transferAmount = ethers.parseUnits("1234", 18); // 根据需要调整数量
        await token.transfer(frogFund.target, transferAmount);
        await frogFund.connect(addr2).reviewProgress(0, progress, comment, approved);

        expect(await frogFund.approvalComments(0, progress)).to.equal(comment);

        const creatorBalanceEth = await frogFund.getCreatorEthBalance(addr1.address);
        const goalAmount = ethers.parseUnits("500", 18);
        console.log('当前进度:', progress);
           const creatorBalance = await frogFund.getCreatorBalance(addr1.address);
        const erc = await token.balanceOf(addr1.address);
        const addr1Eth = await ethers.provider.getBalance(addr1.address);
        const addr2Eth = await ethers.provider.getBalance(addr2.address);
        const addr1Token = await token.balanceOf(addr1.address);
        const addr2Token = await token.balanceOf(addr2.address);
        // console.log('审批后addr1内的合约金额:', ethers.formatUnits(creatorBalance, 18), '审批后addr1内的代币金额:',ethers.formatUnits(erc, 18));
        console.log('审批后addr1内的ETH金额:',  ethers.formatUnits(addr1Eth, 18),'审批后addr2内的ETH金额:', ethers.formatUnits(addr2Eth, 18));
        console.log('审批后addr1内的Toekn金额:',  ethers.formatUnits(addr1Token, 18),'审批后addr2内的Token金额:', ethers.formatUnits(addr2Token, 18));
        expect(Number(ethers.formatUnits(creatorBalanceEth, 18))).to.equal(
            (Number(ethers.formatUnits(goalAmount, 18)) * progress) / 100
        );
    }

    before(async () => {
    
    });

    beforeEach(async () => {
        await createProject();
        await supportProject();
    });

    it("30% - 100% Should allow owner to approve project progress", async function () {
        await approveProgress(30, "Project is 30% completed", "Looks good");
        
        await approveProgress(50, "Project is 50% completed", "Looks good");
        await approveProgress(70, "Project is 70% completed", "Looks good");
        await approveProgress(100, "Project is 100% completed", "Looks good");
    });

});



} );
