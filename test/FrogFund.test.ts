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
    describe( "reviewProgress", function () {
        beforeEach( async () => {
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
            console.log(deadline,'时间@@@@@@@@@@@');
            
            // 使用 ETH 支持项目，使其达到目标金额
            const projectId = 0;
            const supportAmount = ethers.parseUnits( "500", 18 );
            await expect(
                frogFund
                    .connect( addr2 )
                    .supportProjectWithEth( projectId, { value: supportAmount } )
            )
                .to.emit( frogFund, "ProjectFunded" )
                .withArgs( projectId, addr2.address, supportAmount, true );
        } );
        after( async () => {
            // const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
            // const inBalance = await frogFund.getCreatorBalance( addr2.address );
            // const inBalanceEth = await frogFund.getCreatorEthBalance( addr2.address );
            // const creatorBalanceEth = await frogFund.getCreatorEthBalance( addr1.address );
            // const frogFundErc20 = await token.balanceOf( frogFund.target )
            // const detail = await frogFund.getProjectDetails( 0 );

            // console.log( '@@@合约代币余额:@@@', ethers.formatUnits( frogFundErc20 ));
            // console.log('投资人代币:',ethers.formatUnits(inBalance));
            // console.log('投资人eth:',ethers.formatUnits(inBalanceEth));
            // console.log('项目人代币:',ethers.formatUnits(creatorBalance));
            // console.log('项目人eth:',ethers.formatUnits(creatorBalanceEth));
        //    const res = await frogFund.transferTokens( addr1.address,ethers.parseUnits( "1", 18 ))
           const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
           const erc = await token.balanceOf( addr1.address );
            console.log('@@@',ethers.formatUnits(creatorBalance,18),ethers.formatUnits(erc,18),erc,creatorBalance)

        } )
        it( "30% Should allow owner to approve project progress ", async function () {
            const goalAmount = ethers.parseUnits( "500", 18 );
            const progress = 30;
            const details = "Project is 30% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );
            const comment = "Looks good";
            const approved = true;

            // 向合约转移足够的代币，以便进行分配
            const transferAmount = ethers.parseUnits( "1234", 18 ); // 根据需要调整数量
            await token.transfer( frogFund.target, transferAmount );
            const res2 = await token.balanceOf( frogFund.target );
            await frogFund
                .connect( addr2 )
                .reviewProgress( 0, progress, comment, approved );

            expect( await frogFund.approvalComments( 0, progress ) ).to.equal( comment );

            // 检查是否分配资金给项目发起人
            const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
            const creatorBalanceEth = await frogFund.getCreatorEthBalance(
                addr1.address
            );
            const detail = await frogFund.getProjectDetails( 0 );

            // 项目人员应该收到项目金额的30%
            expect( Number( ethers.formatUnits( creatorBalanceEth, 18 ) ) ).to.equal(
                ( ethers.formatUnits( goalAmount, 18 ) * progress ) / 100
            );
        } );
        it( "50% Should allow owner to approve project progress ", async function () {
            const goalAmount = ethers.parseUnits( "500", 18 );
            const progress = 50;
            const details = "Project is 30% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );
            const comment = "Looks good";
            const approved = true;

            // 向合约转移足够的代币，以便进行分配
            const transferAmount = ethers.parseUnits( "1234", 18 ); // 根据需要调整数量
            await token.transfer( frogFund.target, transferAmount );
            const res2 = await token.balanceOf( frogFund.target );
            await frogFund
                .connect( addr2 )
                .reviewProgress( 0, progress, comment, approved );

            expect( await frogFund.approvalComments( 0, progress ) ).to.equal( comment );

            // 检查是否分配资金给项目发起人
            const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
            const creatorBalanceEth = await frogFund.getCreatorEthBalance(
                addr1.address
            );
            const detail = await frogFund.getProjectDetails( 0 );

            // 项目人员应该收到项目金额的30%
            expect( Number( ethers.formatUnits( creatorBalanceEth, 18 ) ) ).to.equal(
                ( ethers.formatUnits( goalAmount, 18 ) * progress ) / 100
            );
        } );
        it( "70% Should allow owner to approve project progress ", async function () {
            const goalAmount = ethers.parseUnits( "500", 18 );
            const progress = 70;
            const details = "Project is 30% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );
            const comment = "Looks good";
            const approved = true;

            // 向合约转移足够的代币，以便进行分配
            const transferAmount = ethers.parseUnits( "1234", 18 ); // 根据需要调整数量
            await token.transfer( frogFund.target, transferAmount );
            const res2 = await token.balanceOf( frogFund.target );
            await frogFund
                .connect( addr2 )
                .reviewProgress( 0, progress, comment, approved );

            expect( await frogFund.approvalComments( 0, progress ) ).to.equal( comment );

            // 检查是否分配资金给项目发起人
            const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
            const creatorBalanceEth = await frogFund.getCreatorEthBalance(
                addr1.address
            );
            const inBalance = await frogFund.getCreatorBalance( addr2.address );
            const inBalanceEth = await frogFund.getCreatorEthBalance( addr2.address );
            const frogFundErc20 = await token.balanceOf( frogFund.target )

            console.log( '@@@合约代币余额:@@@', ethers.formatUnits( frogFundErc20 ));
            console.log('投资人代币:',ethers.formatUnits(inBalance));
            console.log('投资人eth:',ethers.formatUnits(inBalanceEth));
            console.log('项目人代币:',ethers.formatUnits(creatorBalance));
            console.log('项目人eth:',ethers.formatUnits(creatorBalanceEth));
            const detail = await frogFund.getProjectDetails( 0 );

            // 项目人员应该收到项目金额的30%
            expect( Number( ethers.formatUnits( creatorBalanceEth, 18 ) ) ).to.equal(
                ( ethers.formatUnits( goalAmount, 18 ) * progress ) / 100
            );
            
        } );
        it( "100% Should allow owner to approve project progress ", async function () {
            const goalAmount = ethers.parseUnits( "500", 18 );
            const progress = 100;
            const details = "Project is 30% completed";
            await frogFund.connect( addr1 ).updateProgress( 0, progress, details );
            const comment = "Looks good";
            const approved = true;

            // 向合约转移足够的代币，以便进行分配
            const transferAmount = ethers.parseUnits( "1234", 18 ); // 根据需要调整数量
            await token.transfer( frogFund.target, transferAmount );
            const res2 = await token.balanceOf( frogFund.target );
            await frogFund
                .connect( addr2 )
                .reviewProgress( 0, progress, comment, approved );

            expect( await frogFund.approvalComments( 0, progress ) ).to.equal( comment );

            // 检查是否分配资金给项目发起人
            const creatorBalance = await frogFund.getCreatorBalance( addr1.address );
            const creatorBalanceEth = await frogFund.getCreatorEthBalance(
                addr1.address
            );
            const detail = await frogFund.getProjectDetails( 0 );

            // 项目人员应该收到项目金额的100%
            expect( Number( ethers.formatUnits( creatorBalanceEth, 18 ) ) ).to.equal(
                ( ethers.formatUnits( goalAmount, 18 ) * progress ) / 100
            );
        } );
    } );
} );
