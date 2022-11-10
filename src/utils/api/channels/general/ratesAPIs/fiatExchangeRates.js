import { timeout } from '../../../../promises'
const { DOMParser } = require('xmldom')

import { REQUEST_TIMEOUT_MS } from '../../../../../../env/index'
import axios from 'axios'

export const getFiatExchangeRates = () => {
  const address = `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`

  return new Promise((resolve) => {
    axios.get(address)
    .then((res) => {
      const response = res.data
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, "text/xml");
      let exchangeRates = {}

      x = xmlDoc.getElementsByTagName('Cube');
      for (i = 0; i < x.length; i++) {
        const currency = x[i].getAttribute('currency')
        const rate = x[i].getAttribute('rate')

        if (
          currency != null &&
          /^[a-zA-Z]+$/.test(currency) &&
          rate != null &&
          !isNaN(Number(rate))
        ) {
          exchangeRates[currency] = Number(rate)
        }
      }

      exchangeRates['EUR'] = 1

      for (const currencyTicker in exchangeRates) {
        if (currencyTicker !== 'USD') {
          if (
            exchangeRates["USD"] == null ||
            exchangeRates["USD"] == 0
          ) {
            exchangeRates[currencyTicker] = null;
          } else {
            exchangeRates[currencyTicker] =
              exchangeRates[currencyTicker] / exchangeRates["USD"];
          }
        }
      }

      exchangeRates['USD'] = 1

      resolve({ result: exchangeRates });
    })
    .catch((error) => {
      resolve({error})
    })
  });
}