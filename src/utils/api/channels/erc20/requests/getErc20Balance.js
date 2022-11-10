import { ethers } from "ethers"
import { ETHERS } from "../../../../constants/web3Constants"
import Web3Provider from "../../../../web3/provider"
import BigNumber from "bignumber.js";

/**
 * Gets the balance of an address in an ERC20 token as a big number
 * @param {String} address The ethereum address to get the balance of
 * @param {Object} contract The contract object of the ERC20 token created in the Web3Interface
 */
export const getErc20Balance = async (address, contract) => {  
  if (contract.balanceOf) {
    return await contract.balanceOf(address)
  } else throw new Error(`ERC20 contract ${contract.address} does not support a known balance function.`)
}

export const getStandardErc20Balance = async (address, contractAddress, decimals = ETHERS) => {
  return BigNumber(
    ethers.utils.formatUnits(
      await getErc20Balance(
        address,
        Web3Provider.getContract(contractAddress, [
          {
            "constant":true,
            "inputs":[{"name":"_owner","type":"address"}],
            "name":"balanceOf",
            "outputs":[{"name":"balance","type":"uint256"}],
            "type":"function"
          }
        ])
      ),
      decimals
    )
  );
};