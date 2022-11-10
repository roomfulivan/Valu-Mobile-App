/*
  The authentication reducer is to contain sensitive account data
  while the app is loaded. When the user logs out, or the app is
  completely closed, only the non-sensitive data should persist.
*/

import { AUTHENTICATE_USER_SEND_MODAL } from "../utils/constants/sendModal";
import {
  SET_ACCOUNTS,
  UPDATE_ACCOUNT_KEYS,
  DISABLE_SELECT_DEFAULT_ACCOUNT,
  BIOMETRIC_AUTH,
  AUTHENTICATE_USER,
  SIGN_IN_USER,
  SET_ADDRESSES,
  SIGN_OUT_COMPLETE,
  SIGN_OUT,
  PUSH_MODAL,
  OPEN_SEND_COIN_MODAL
} from "../utils/constants/storeType";

export const authentication = (
  state = {
    accounts: [],
    sessionKey: null,
    activeAccount: {
      id: null,
      accountHash: null,
      seeds: {},
      keys: {},
      paymentMethods: {},
      biometry: false,
      keyDerivationVersion: 1
    },
    signedIn: false,
    selectDefaultAccount: true,
    authModalUsed: false
  },
  action
) => {
  switch (action.type) {
    case OPEN_SEND_COIN_MODAL:
      return {
        ...state,
        authModalUsed:
          action.payload.type === AUTHENTICATE_USER_SEND_MODAL
            ? true
            : state.authModalUsed,
      };
    case DISABLE_SELECT_DEFAULT_ACCOUNT:
      return {
        ...state,
        selectDefaultAccount: false
      };
    case SET_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload.accounts
      };
    case AUTHENTICATE_USER:
      return {
        ...state,
        activeAccount: action.activeAccount,
        sessionKey: action.sessionKey
      };
    case SIGN_IN_USER:
      return {
        ...state,
        signedIn: true,
        selectDefaultAccount: false
      };
    case UPDATE_ACCOUNT_KEYS:
      return {
        ...state,
        activeAccount: {
          ...state.activeAccount,
          keys: action.keys
        }
      };
    case SET_ADDRESSES:
      const currentAddrs = state.activeAccount.keys[action.payload.chainTicker]
        ? state.activeAccount.keys[action.payload.chainTicker][action.payload.channel]
        : {};

      if (state.activeAccount.keys[action.payload.chainTicker] == null) return state

      return {
        ...state,
        activeAccount: {
          ...state.activeAccount,
          keys: {
            ...state.activeAccount.keys,
            [action.payload.chainTicker]: {
              ...state.activeAccount.keys[action.payload.chainTicker],
              [action.payload.channel]: {
                ...currentAddrs,
                addresses: action.payload.addresses
              }
            }
          }
        }
      };
    case SIGN_OUT_COMPLETE:
      return {
        ...state,
        activeAccount: null,
        sessionKey: null
      };
    case SIGN_OUT:
      return {
        ...state,
        signedIn: false,
      };
    case BIOMETRIC_AUTH:
      return {
        ...state,
        activeAccount: { ...state.activeAccount, biometry: action.payload.biometry },
        accounts: action.payload.accounts
      };
    default:
      return state;
  }
};
