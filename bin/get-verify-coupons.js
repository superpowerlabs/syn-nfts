#!/usr/bin/env node
require('dotenv').config()
const [,,network] = process.argv
const chainId = network === 'bsc' ? '56' : '97'
const deployed = require('../export/deployed.json')[chainId]

const cmd =`npx hardhat verify --show-stack-traces \\
  --network ${network} \\
  ${deployed.SynCityCoupons} \\
  7000 \\
  ${process.env.BINANCE_ADDRESS}
`

console.log(cmd)