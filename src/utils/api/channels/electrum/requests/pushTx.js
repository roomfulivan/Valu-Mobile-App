import { postElectrum } from '../callCreators'
import { getUnspentFormatted } from './getUnspent';
import { maxSpendBalance, satsToCoins, coinsToSats, truncateDecimal } from '../../../../math'
import coinSelect from 'coinselect';
import { buildSignedTx } from '../../../../crypto/buildTx'
import { ELECTRUM } from '../../../../constants/intervalConstants';
import BigNumber from 'bignumber.js';
import { requestPrivKey } from '../../../../auth/authBox';

export const pushTx = (coinObj, _rawtx) => {
  const callType = 'pushtx'
  let serverList = coinObj.electrum_endpoints
  let data = { rawtx: _rawtx }

  return new Promise((resolve, reject) => {
    postElectrum(serverList, callType, data)
    .then((response) => {
      if (
        !response ||
        !response.result ||
        typeof response.result !== "string"
      ) {
        resolve({
          err: true,
          result: response,
        });
      } else {
        resolve({
          err: false,
          result: {
            txid: response.result,
            params: {},
          },
        });
      }
    })
  });
}

export const txPreflight = (
  coinObj,
  activeUser,
  outputAddress,
  value,
  params,
  signTx = false
) => {
  let { defaultFee, network, verifyMerkle, verifyTxid } = params;
  value = BigNumber(truncateDecimal(coinsToSats(value), coinObj.decimals));

  return new Promise((resolve, reject) => {
    getUnspentFormatted(coinObj, activeUser, verifyMerkle, verifyTxid)
      .then(async (res) => {
        utxoList = res.utxoList;
        let unshieldedFunds = res.unshieldedFunds;

        if (utxoList && utxoList.length) {
          let utxoListFormatted = [];
          let totalInterest = 0;
          let interestClaimThreshold = 200;
          let utxoVerified = true;
          let changeAddress;
          let feePerByte = 0;
          let btcFees = false;
          let feeTakenFromAmount = false;
          let amountSubmitted = value;

          if (
            typeof defaultFee === "object" &&
            typeof defaultFee !== "null" &&
            defaultFee.feePerByte != null
          ) {
            //BTC Fee style detected, changing fee unit to fee per byte and
            //feeding value into coinselect
            feePerByte = Number(defaultFee.feePerByte);
            defaultFee = BigNumber(0);
            btcFees = true;
          }

          if (
            activeUser.keys[coinObj.id] != null &&
            activeUser.keys[coinObj.id].electrum != null &&
            activeUser.keys[coinObj.id].electrum.addresses.length > 0
          ) {
            changeAddress = activeUser.keys[coinObj.id].electrum.addresses[0];
          } else {
            throw new Error(
              "Error, " +
                activeUser.id +
                " user keys for active coin " +
                coinObj.id +
                " not found!"
            );
          }

          for (let i = 0; i < utxoList.length; i++) {
            if (network.coin === "komodo" || network.coin === "kmd") {
              utxoListFormatted.push({
                txid: utxoList[i].txid,
                vout: utxoList[i].vout,
                value: utxoList[i].amountSats,
                interestSats: utxoList[i].interestSats,
                verifiedMerkle: utxoList[i].verifiedMerkle,
                verifiedTxid: utxoList[i].verifiedTxid,
              });
            } else {
              utxoListFormatted.push({
                txid: utxoList[i].txid,
                vout: utxoList[i].vout,
                value: utxoList[i].amountSats,
                verified: utxoList[i].verified ? utxoList[i].verified : false,
                verifiedMerkle: utxoList[i].verifiedMerkle,
                verifiedTxid: utxoList[i].verifiedTxid,
              });
            }
          }

          const _maxSpendBalance = maxSpendBalance(utxoListFormatted);

          let targets = [
            {
              address: outputAddress,
              value: value,
            },
          ];

          //If a no fee per byte is passed, the default transaction fee is used
          if (feePerByte === 0) {
            //if transaction value is more than what is spendable with fee included, subtract fee from amount
            //else, add fee to amount to take fee from wallet
            if (value.isGreaterThan(_maxSpendBalance.minus(defaultFee))) {
              amountSubmitted = value;
              value = _maxSpendBalance.minus(defaultFee);
              targets[0].value = _maxSpendBalance;

              feeTakenFromAmount = true;
            } else {
              targets[0].value = targets[0].value.plus(defaultFee);
            }
          }

          targets[0].value = targets[0].value.toNumber();

          let { inputs, outputs, fee } = coinSelect(
            utxoListFormatted,
            targets,
            feePerByte
          );

          if (!outputs) {
            amountSubmitted = value;
            value = value.minus(BigNumber(fee));
            targets[0].value = value.toNumber();
            feeTakenFromAmount = true;

            let secondRun = coinSelect(utxoListFormatted, targets, feePerByte);
            inputs = secondRun.inputs;
            outputs = secondRun.outputs;
            fee = secondRun.fee;
          }

          if (!outputs) {
            throw new Error(
              "Insufficient funds. Failed to calculate acceptable transaction amount with fee of " +
                satsToCoins(BigNumber(fee ? fee : defaultFee)) +
                "."
            );
          }

          if (!fee) {
            outputs[0].value = BigNumber(outputs[0].value)
              .minus(defaultFee)
              .toNumber();
          }

          let _change = 0;

          if (outputs && outputs.length === 2) {
            _change = outputs[1].value;
          }

          // check if any outputs are unverified
          if (inputs && inputs.length) {
            for (let i = 0; i < inputs.length; i++) {
              //TODO: Warnings for both txid verification and merkle verification
              if (!inputs[i].verifiedMerkle) {
                utxoVerified = false;
                break;
              }
            }

            for (let i = 0; i < inputs.length; i++) {
              if (Number(inputs[i].interestSats) > interestClaimThreshold) {
                totalInterest += Number(inputs[i].interestSats);
              }
            }
          }

          if (value.isGreaterThan(_maxSpendBalance)) {
            const successObj = {
              err: true,
              result:
                `Spend value is too large. Max available amount is ${satsToCoins(
                  _maxSpendBalance
                ).toString()}.` +
                (unshieldedFunds.isGreaterThan(BigNumber(0))
                  ? `\n\nThis is most likely due to the fact that you have ${satsToCoins(
                      unshieldedFunds
                    ).toString()} ${coinObj.id}
          in unshielded funds received from mining in your wallet. Please unshield through a native client prior to sending through Verus Mobile`
                  : null),
            };

            resolve(successObj);
          } else {
            // account for KMD interest
            if (
              (network.coin === "komodo" || network.coin === "kmd") &&
              totalInterest > 0
            ) {
              // account for extra vout
              // const _feeOverhead = outputs.length === 1 ? estimateTxSize(0, 1) * feeRate : 0;
              const _feeOverhead = 0;

              if (__DEV__) {
                console.log(
                  `max interest to claim ${totalInterest} (${
                    totalInterest * 0.00000001
                  })`
                );
                console.log(`estimated fee overhead ${_feeOverhead}`);
                console.log(
                  `current change amount ${_change} (${
                    _change * 0.00000001
                  }), boosted change amount ${
                    _change + (totalInterest - _feeOverhead)
                  } (${
                    (_change + (totalInterest - _feeOverhead)) * 0.00000001
                  })`
                );
              }

              if (_maxSpendBalance.isEqualTo(value)) {
                _change = Math.abs(totalInterest) - _change - _feeOverhead;

                if (outputAddress === changeAddress) {
                  value = value.plus(BigNumber(_change));
                  _change = 0;
                  if (__DEV__) {
                    console.log(
                      `send to self ${outputAddress} = ${changeAddress}`
                    );
                    console.log(
                      `send to self old val ${value}, new val ${
                        value + _change
                      }`
                    );
                  }
                }
              } else {
                _change = _change + (Math.abs(totalInterest) - _feeOverhead);
              }
            }

            if (!inputs && !outputs) {
              const successObj = {
                err: true,
                result: "Can't find best fit utxo. Try lower amount.",
              };

              resolve(successObj);
            } else {
              let vinSum = 0;

              for (let i = 0; i < inputs.length; i++) {
                vinSum += inputs[i].value;
              }

              const _estimatedFee = vinSum - outputs[0].value - _change;

              let _rawtx;

              if (signTx) {
                _rawtx = buildSignedTx(
                  outputAddress,
                  changeAddress,
                  await requestPrivKey(coinObj.id, ELECTRUM),
                  network,
                  inputs,
                  _change,
                  value.toNumber(),
                  coinObj.max_fee_rate_per_byte
                );
              }
              
              const successObj = {
                err: false,
                result: {
                  fee: btcFees
                    ? satsToCoins(BigNumber(fee)).toString()
                    : satsToCoins(BigNumber(_estimatedFee)).toString(),
                  value: satsToCoins(value).toString(),
                  toAddress: outputAddress,
                  fromAddress: changeAddress,
                  amountSubmitted: satsToCoins(amountSubmitted).toString(),
                  memo: null,
                  params: {
                    utxoSet: inputs,
                    change: _change,
                    inputs,
                    outputs,
                    feeTakenFromAmount,
                    network,
                    rawtx: _rawtx,
                    utxoVerified,
                    unshieldedFunds,
                  },
                },
              };

              resolve(successObj);
            }
          }
        } else {
          resolve({
            err: true,
            result:
              `No spendable funds found.` +
              (unshieldedFunds.isGreaterThan(BigNumber(0))
                ? `\n\nThis is most likely due to the fact that you have ${satsToCoins(
                    unshieldedFunds
                  ).toString()} ${coinObj.id}
        in unshielded funds received from mining in your wallet. Please unshield through a native client prior to sending through Verus Mobile`
                : null),
          });
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
};

export const sendRawTx = (coinObj, activeUser, outputAddress, value, params) => {
  const { defaultFee, network, verifyMerkle, verifyTxid } = params

  return new Promise((resolve, reject) => {
    txPreflight(
      coinObj,
      activeUser,
      outputAddress,
      value,
      {
        defaultFee,
        network,
        verifyMerkle,
        verifyTxid,
      },
      true
    )
      .then((resObj) => {
        if (resObj.err) {
          reject(resObj);
        } else {
          return pushTx(coinObj, resObj.result.params.rawtx);
        }
      })
      .then((resObj) => {
        if (resObj.err || resObj.result.code) {
          reject({
            err: true,
            result: resObj.result.result.message,
          });
        } else {
          resolve(resObj);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}