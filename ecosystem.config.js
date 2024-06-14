const path = require('path');

// 获取项目的根目录路径
const projectDir = path.resolve(__dirname);
module.exports = {
	apps: [
		{
			name: 'hardhat-node',
			script: './start-hardhat.sh',
			cwd: projectDir, // 替换为项目的实际路径
			interpreter: '/bin/bash', // 使用 bash 解释器
			env: {
				NODE_ENV: 'development',
			},
		},
	],
};
