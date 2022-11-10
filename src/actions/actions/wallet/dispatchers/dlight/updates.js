import {
  getInfo,
  getPrivateBalance,
  getZTransactions,
} from '../../../../../utils/api/channels/dlight/callCreators';
import {DLIGHT_PRIVATE} from '../../../../../utils/constants/intervalConstants';

export const updateDlightBalances = async (activeUser, coinObj) => {
  const zBalances = await getPrivateBalance(
    coinObj.id,
    activeUser.accountHash,
    coinObj.proto,
  );

  const {result, ...header} = zBalances;
  const {confirmed, total} = result;

  return {
    chainTicker: coinObj.id,
    channel: DLIGHT_PRIVATE,
    header,
    body: {
      confirmed: confirmed,
      pending: total.minus(confirmed).toString(),
      total: total,
    },
  };
};

export const updateDlightInfo = async (activeUser, coinObj) => {
  const syncInfo = await getInfo(
    coinObj.id,
    activeUser.accountHash,
    coinObj.proto,
  );

  const {result, ...header} = syncInfo;

  return {
    chainTicker: coinObj.id,
    channel: DLIGHT_PRIVATE,
    header,
    body: result,
  };
};

export const updateDlightTransactions = async (activeUser, coinObj) => {
  const zTransactions = await getZTransactions(
    coinObj.id,
    activeUser.accountHash,
    coinObj.proto,
    'all',
  );
  const {result, ...header} = zTransactions;

  return {
    chainTicker: coinObj.id,
    channel: DLIGHT_PRIVATE,
    header,
    body: result.map(standardizeDlightTxObj),
  };
};