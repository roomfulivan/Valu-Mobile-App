import { ethers } from "ethers"
import Web3Provider from '../../../../web3/provider'
import { ERC20, ETH } from "../../../../constants/intervalConstants"
import { scientificToDecimal } from "../../../../math"
import { ETHERS } from "../../../../constants/web3Constants"

// TODO: Add balance recalculation with eth gas
export const txPreflight = async (coinObj, activeUser, address, amount, params) => {
  try {
    const fromAddress = activeUser.keys[coinObj.id][ERC20].addresses[0]
    const signer = new ethers.VoidSigner(fromAddress, Web3Provider.DefaultProvider)
    const contract = Web3Provider.getContract(coinObj.currency_id).connect(signer)
    const gasPrice = await Web3Provider.DefaultProvider.getGasPrice()
    const amountBn = ethers.utils.parseUnits(
      scientificToDecimal(amount.toString()),
      coinObj.decimals
    );

    const gasEst = await contract.estimateGas.transfer(address, amountBn)
    const transaction = await contract.callStatic.transfer(
      address,
      amountBn
    );

    const maxFee = gasEst.mul(gasPrice)
    
    return {
      err: false,
      result: {
        fee: ethers.utils.formatUnits(
            maxFee,
            ETHERS
          ),
        feeCurr: ETH.toUpperCase(),
        value: ethers.utils.formatUnits(amountBn, coinObj.decimals),
        toAddress: address,
        fromAddress,
        amountSubmitted: amount.toString(),
        memo: null,
        params: {
          utxoVerified: true,
        },
      },
    };
  } catch(e) {
    console.error(e)

    return {
      err: true,
      result: e.message
    }
  }
}