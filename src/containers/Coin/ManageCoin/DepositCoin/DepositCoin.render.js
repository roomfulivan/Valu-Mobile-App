import React, { Component } from "react"
import { 
  View, 
  ScrollView
} from "react-native";
import { List, Text, Divider, Portal } from "react-native-paper"
import Styles from '../../../../styles/index'
import AnimatedActivityIndicatorBox from "../../../../components/AnimatedActivityIndicatorBox";
import { ISO_3166_COUNTRIES } from "../../../../utils/constants/iso3166";
import { openDepositSendModal } from "../../../../actions/actions/sendModal/dispatchers/sendModal";
import {
  SEND_MODAL_AMOUNT_FIELD,
  SEND_MODAL_DESTINATION_FIELD,
  SEND_MODAL_FROM_CURRENCY_FIELD,
  SEND_MODAL_SOURCE_FIELD,
  SEND_MODAL_TO_CURRENCY_FIELD,
} from "../../../../utils/constants/sendModal";
import BankTransferDetailsModal from "../../../../components/BankTransferDetailsModal/BankTransferDetailsModal";
import MissingInfoRedirect from "../../../../components/MissingInfoRedirect/MissingInfoRedirect";

export const DepositCoinRender = function () {  
  const hasSources = this.props.depositSources != null && this.props.depositSources.length > 0
  const sources = this.props.depositSources == null ? [] : this.props.depositSources;
  const pendingDeposits = this.props.pendingDeposits == null ? [] : this.props.pendingDeposits;
  
  return this.props.depositSources == null ? (
    <AnimatedActivityIndicatorBox />
  ) : !hasSources ? (
    <MissingInfoRedirect
      icon={"bank-transfer-out"}
      label={"Add funding sources under the services tab to see them here."}
      onPress={() =>
        this.props.navigation.navigate("Home", {
          screen: "ServicesHome",
          initial: false,
        })
      }
    />
  ) : (
    <View style={Styles.defaultRoot}>
      <ScrollView style={Styles.fullWidth} contentContainerStyle={Styles.horizontalCenterContainer}>
        <Portal>
          {this.state.bankTransferDetailsModalParams.open == true && (
            <BankTransferDetailsModal
              visible={this.state.bankTransferDetailsModalParams.open}
              cancel={() => this.setBankTransferDetailsModalParams(false)}
              {...this.state.bankTransferDetailsModalParams.props}
            />
          )}
        </Portal>
        {pendingDeposits.length > 0 && (
          <React.Fragment>
            <View style={Styles.fullWidth}>
              <List.Subheader style={Styles.wide}>{"Pending deposits"}</List.Subheader>
              <Divider />
            </View>
            {pendingDeposits.map((deposit, index) => {
              const { transfer, followup } = deposit;
              const { sourceName, destAmount, destCurrency, sourceAmount, sourceCurrency } =
                transfer;

              return (
                <View
                  key={index}
                  style={{
                    width: "100%",
                  }}
                >
                  <List.Item
                    title={`${destAmount} ${destCurrency}`}
                    description={
                      followup == null
                        ? `from ${sourceName}`
                        : "Press here to manually complete this deposit"
                    }
                    onPress={() =>
                      this.selectBankTransfer({
                        amount: sourceAmount,
                        currency: sourceCurrency,
                        ...followup,
                      })
                    }
                  />
                  <Divider />
                </View>
              );
            })}
          </React.Fragment>
        )}
        <View style={Styles.fullWidth}>
          <List.Subheader style={Styles.wide}>{"Select an account to deposit from"}</List.Subheader>
          <Divider />
        </View>
        {sources.map((source, index) => {
          const { displayName, countryCode, currencies } = source;
          const isoCountry =
            ISO_3166_COUNTRIES[countryCode] == null ? {} : ISO_3166_COUNTRIES[countryCode];

          return (
            <View
              key={index}
              style={{
                width: "100%",
              }}
            >
              <List.Item
                left={() =>
                  isoCountry.emoji == null ? null : (
                    <Text style={{ fontSize: 40 }}>{isoCountry.emoji}</Text>
                  )
                }
                onPress={() => {
                  openDepositSendModal(this.props.activeCoin, this.props.subWallet, {
                    [SEND_MODAL_AMOUNT_FIELD]: "",
                    [SEND_MODAL_SOURCE_FIELD]: source,
                    [SEND_MODAL_FROM_CURRENCY_FIELD]: currencies[Object.keys(currencies)[0]],
                  });
                }}
                title={displayName}
                description={isoCountry.name}
              />
              <Divider />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
