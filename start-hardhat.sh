#!/bin/bash

# 获取当前脚本所在目录的绝对路径
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# 进入项目目录
cd $DIR

# 使用项目内的 pnpm 和 hardhat 启动 hardhat node
pnpm ./node_modules/.bin/hardhat node
