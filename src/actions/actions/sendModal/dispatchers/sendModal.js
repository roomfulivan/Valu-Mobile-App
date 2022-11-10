import store from '../../../../store';
import {
  CONVERSION_SEND_MODAL,
  WITHDRAW_SEND_MODAL,
  SEND_MODAL,
  SEND_MODAL_AMOUNT_FIELD,
  SEND_MODAL_FROM_CURRENCY_FIELD,
  SEND_MODAL_MEMO_FIELD,
  SEND_MODAL_TO_ADDRESS_FIELD,
  SEND_MODAL_TO_CURRENCY_FIELD,
  TRADITIONAL_CRYPTO_SEND_MODAL,
  SEND_MODAL_DESTINATION_FIELD,
  DEPOSIT_SEND_MODAL,
  SEND_MODAL_SOURCE_FIELD,
  SEND_MODAL_IDENTITY_TO_LINK_FIELD,
  LINK_IDENTITY_SEND_MODAL,
  SEND_MODAL_USER_TO_AUTHENTICATE,
  AUTHENTICATE_USER_SEND_MODAL,
} from '../../../../utils/constants/sendModal';
import {
  CLOSE_SEND_COIN_MODAL,
  OPEN_SEND_COIN_MODAL,
  SET_SEND_COIN_MODAL_DATA_FIELD,
  SET_SEND_COIN_MODAL_VISIBLE,
} from '../../../../utils/constants/storeType';

export const openSendModal = (
  title,
  coinObj,
  subWallet,
  data,
  type,
  helpText,
  initialRouteName
) => {
  store.dispatch({
    type: OPEN_SEND_COIN_MODAL,
    payload: {
      title,
      coinObj,
      subWallet: subWallet,
      data,
      type,
      helpText,
      initialRouteName
    },
  });
};

export const openTraditionalCryptoSendModal = (coinObj, subWallet, data) => {
  openSendModal(
    `Send ${coinObj.id}`,
    coinObj,
    subWallet,
    data == null
      ? {
          [SEND_MODAL_TO_ADDRESS_FIELD]: '',
          [SEND_MODAL_AMOUNT_FIELD]: '',
          [SEND_MODAL_MEMO_FIELD]: '',
        }
      : data,
    TRADITIONAL_CRYPTO_SEND_MODAL,
    'To send cryptocurrency, enter a recipients address in the address field, enter an amount to send, and press "send". You will be shown your transaction details before they are sent so you can confirm them.',
  );
};

export const openLinkIdentityModal = (coinObj, data) => {
  openSendModal(
    `Link VerusID`,
    coinObj,
    null,
    data == null
      ? {
          [SEND_MODAL_IDENTITY_TO_LINK_FIELD]: '',
        }
      : data,
    LINK_IDENTITY_SEND_MODAL,
    'To link a VerusID with your wallet, enter the handle or i-Address of a VerusID with a primary address that you have in your wallet.',
  );
};

export const openAuthenticateUserModal = (data, initialRouteName) => {
  openSendModal(
    `Login`,
    null,
    null,
    data == null
      ? {
          [SEND_MODAL_USER_TO_AUTHENTICATE]: null,
        }
      : data,
    AUTHENTICATE_USER_SEND_MODAL,
    'To login, select a user profile, then enter your password.',
    initialRouteName
  );
};

export const openConversionSendModal = (coinObj, subWallet, data) => {
  openSendModal(
    `Convert Currency`,
    coinObj,
    subWallet,
    data == null
      ? {
          //[SEND_MODAL_TO_ADDRESS_FIELD]: "",
          [SEND_MODAL_AMOUNT_FIELD]: '',
          [SEND_MODAL_FROM_CURRENCY_FIELD]: null,
          [SEND_MODAL_TO_CURRENCY_FIELD]: null,
        }
      : data,
    CONVERSION_SEND_MODAL,
    'To convert cryptocurrency, select a source and destination currency, enter an amount to convert, and press "convert". All rates shown on the form page are estimations.',
  );
};

export const openWithdrawSendModal = (coinObj, subWallet, data) => {
  openSendModal(
    `Withdraw ${coinObj.id}`,
    coinObj,
    subWallet,
    data == null
      ? {
          [SEND_MODAL_AMOUNT_FIELD]: '',
          [SEND_MODAL_DESTINATION_FIELD]: {},
          [SEND_MODAL_TO_CURRENCY_FIELD]: {},
        }
      : data,
    WITHDRAW_SEND_MODAL,
    'Select a bank account and enter an amount to withdraw from your wallet.',
  );
};

export const openDepositSendModal = (coinObj, subWallet, data) => {
  openSendModal(
    `Deposit ${coinObj.id}`,
    coinObj,
    subWallet,
    data == null
      ? {
          [SEND_MODAL_AMOUNT_FIELD]: '',
          [SEND_MODAL_SOURCE_FIELD]: {},
          [SEND_MODAL_TO_CURRENCY_FIELD]: {},
        }
      : data,
    DEPOSIT_SEND_MODAL,
    'Select a bank account and enter an amount to deposit into your wallet.',
  );
};

export const openSubwalletSendModal = (coinObj, subWallet, data) => {
  switch (subWallet.modals[SEND_MODAL]) {
    case TRADITIONAL_CRYPTO_SEND_MODAL:
      return openTraditionalCryptoSendModal(coinObj, subWallet, data);
    default:
      return;
  }
};

export const closeSendModal = () => {
  store.dispatch({
    type: CLOSE_SEND_COIN_MODAL,
  });
};

export const setSendModalDataField = (key, value) => {
  store.dispatch({
    type: SET_SEND_COIN_MODAL_DATA_FIELD,
    payload: {key, value},
  });
};

export const setSendModalVisible = visible => {
  store.dispatch({
    type: SET_SEND_COIN_MODAL_VISIBLE,
    payload: {visible},
  });
};
