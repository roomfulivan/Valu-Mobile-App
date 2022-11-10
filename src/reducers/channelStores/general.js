/*
  The coin reducer contains general channel specific information
*/

import {
  INIT_GENERAL_CHANNEL_FINISH,
  CLOSE_GENERAL_CHANNEL,
  SIGN_OUT_COMPLETE
} from '../../utils/constants/storeType'

export const channelStore_general = (state = {
  openCoinChannels: {},
}, action) => {
  switch (action.type) {
    case INIT_GENERAL_CHANNEL_FINISH:
      return {
        ...state,
        openCoinChannels: {
          ...state.openCoinChannels,
          [action.payload.chainTicker]: true
        },
      }
    case CLOSE_GENERAL_CHANNEL:
      return {
        ...state,
        openCoinChannels: {
          ...state.openCoinChannels,
          [action.payload.chainTicker]: false
        },
      }
    case SIGN_OUT_COMPLETE:
      return {
        openCoinChannels: {}
      }
    default:
      return state;
  }
}