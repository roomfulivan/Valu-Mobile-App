import ethers from 'ethers';
import Store from '../../store';
import { DEFAULT_ERC20_ABI } from '../constants/abi';
import {
  ADD_WEB3_CONTRACT,
  CLEAR_WEB3_CONTRACTS,
  REMOVE_WEB3_CONTRACT,
} from "../constants/storeType";

class Web3Interface {
  constructor(network, apiKeys) {
    this.network = network;
    this.keys = apiKeys

    this.DefaultProvider = new ethers.getDefaultProvider(this.network, apiKeys);

    this.EtherscanProvider = new ethers.providers.EtherscanProvider(
      this.network,
      apiKeys.etherscan
    );
    
    this.InfuraProvider = new ethers.providers.InfuraProvider(
      this.network,
      apiKeys.infura
    );
  }

  initContract = async (contractAddress) => {   
    const web3Contracts = Store.getState().channelStore_erc20.web3Contracts

    try {
      if (web3Contracts[contractAddress])
        throw new Error(
          "Cannot initialize existing contract " + contractAddress
        );

      const abi = DEFAULT_ERC20_ABI

      Store.dispatch({
        type: ADD_WEB3_CONTRACT,
        payload: {
          contract: [contractAddress, abi],
        }
      })
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  deleteContract = (contractAddress) => {
    const web3Contracts = Store.getState().channelStore_erc20.web3Contracts

    try {
      if (!web3Contracts[contractAddress])
        throw new Error(
          "Cannot delete uninitialized contract " + contractAddress
        );

      Store.dispatch({
        type: REMOVE_WEB3_CONTRACT,
        payload: {
          contractAddress,
        }
      })
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  deleteAllContracts = () => Store.dispatch({ type: CLEAR_WEB3_CONTRACTS })

  getContract = (contractAddress, customAbiFragment) => {
    const web3Contracts = Store.getState().channelStore_erc20.web3Contracts
    const params = web3Contracts[contractAddress]

    if (!params)
      throw new Error(`ERC20 contract ${contractAddress} not initialized`);
    return new ethers.Contract(
      params[0],
      customAbiFragment != null ? customAbiFragment : params[1],
      this.DefaultProvider
    );
  };
}

export default Web3Interface