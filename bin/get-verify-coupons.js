#!/usr/bin/env node
require('dotenv').config()
const {execSync} = require('child_process')
const deployed = require('../export/deployed.json')
const net = require('net');
const [,,network] = process.argv

const cmd =`npx hardhat verify --show-stack-traces \\
  --network ${network} \\
  ${deployed[network === 'bsc' ? '56' : '97'].SynCityCoupons} \\
  7000 \\
  ${process.env.BINANCE_ADDRESS}
`

console.log(cmd)
