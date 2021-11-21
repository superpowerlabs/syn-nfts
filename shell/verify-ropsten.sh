#!/usr/bin/env bash

# SynNFT
npx hardhat verify --show-stack-traces \
  --network ropsten \
  0x6eb88cD81c2BdED392489428b64fd517d744cf24 \
  "https://blueprints.syn.city/meta/SYNPASS/"

## SynNFTFactory
#npx hardhat verify --show-stack-traces \
#  --network ropsten \
#  0xcd3772437285259D797eE8b46f9f9A7383513d33
