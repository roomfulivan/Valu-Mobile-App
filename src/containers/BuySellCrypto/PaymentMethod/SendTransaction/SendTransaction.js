import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  Text,
  ScrollView,
  } from 'react-native';
import { NavigationActions } from '@react-navigation/compat';
import { sendTransaction } from '../../../../actions/actions/PaymentMethod/WyreAccount';
import StandardButton from '../../../../components/StandardButton';
import styles from './SendTransaction.styles';
import {
  getTransactions
} from '../../../../actions/actions/PaymentMethod/WyreAccount';
import {
  selectTransactionHistoryIsFetching,
  selectTransactionHistory
} from '../../../../selectors/paymentMethods';
import { ListItem } from "react-native-elements";
import Spinner from 'react-native-loading-spinner-overlay';
import Colors from '../../../../globals/colors';

class SendTransaction extends Component {
  componentDidMount() {
    this.props.getTransactions();
  }

  handleConfirm = () => {
    this.props.sendTransaction(
      this.props.route.params.paymentMethod.name,
      this.props.route.params.fromCurr,
      this.props.route.params.fromVal,
      this.props.route.params.toCurr,
      this.props.navigation,
    );
  }

  back = () => {
    this.props.navigation.dispatch(NavigationActions.back());
  }

  render() {
    return(
      <View style={styles.root}>
        <View style={styles.containerConfirmTransaction}>
          <View style={styles.containerTransactionInfo}>
            <Text style={styles.transactionInfoTitleTextStyle}>
              Payment method
            </Text>
            <Text style={styles.transactionInfoSubtitleTextStyle}> 
              {this.props.route.params.paymentMethod.name}
            </Text>

            <Text style={styles.transactionInfoTitleTextStyle}>
              From
            </Text>
            <Text style={styles.transactionInfoSubtitleTextStyle}>
              {
                ` ${this.props.route.params.fromVal} "${this.props.route.params.fromCurr}"`
              }
            </Text>

            <Text style={styles.transactionInfoTitleTextStyle}>
              To
            </Text>
            <Text style={styles.transactionInfoSubtitleTextStyle}>
              {
                `${this.props.route.params.toVal} "${this.props.route.params.toCurr}"`
              }
            </Text>
          </View>    
          <View style={styles.buttonContainer}>
            <StandardButton
              style={styles.backButton}
              title="CANCEL"
              onPress={this.back}
            />
            <StandardButton
              style={styles.saveChangesButton}
              title="CONFIRM"
              onPress={this.handleConfirm}
            />
          </View>
        </View>
        <Text style={styles.textTransactionHistory}>Transaction history</Text>
        <ScrollView>
        <Spinner
          visible={this.props.isTransactionHistoryFetching}
          textContent="Loading..."
          textStyle={{ color: Colors.quaternaryColor }}
          color={Colors.quinaryColor}
        />
          <View>
            {
              this.props.history && this.props.history.data && this.props.history.data.map((item) => (
                <View key={item.id} style={styles.containerTransactionView}>
                  <ListItem
                    title={`From ${item.sourceAmount} ${item.sourceCurrency}`}
                    titleStyle={styles.itemTextTransactionHistory}
                    subtitle={`To ${item.destAmount} ${item.destCurrency}`}
                    subtitleStyle={styles.itemTextTransactionHistory}
                    rightTitle={new Date(item.createdAt).toISOString().split('.')[0]}
                    rightTitleStyle={styles.itemTextTransactionHistory}
                    hideChevron
                    containerStyle={styles.itemContainerTransactionHistory}
                  />
                  <ListItem 
                    title={item.id} 
                    titleStyle={styles.itemIdTransactionHistory}
                    hideChevron
                    rightTitle={item.status}
                    rightTitleStyle={styles.rightTitleStyle}
                    containerStyle={{borderBottomWidth: 0}}
                  />
                </View>
              ))
              
            }
          </View>
        </ScrollView>
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  activeAccount: state.authentication.activeAccount,
  isTransactionHistoryFetching: selectTransactionHistoryIsFetching(state),
  history: selectTransactionHistory(state)
  });
  

const mapDispatchToProps = ({
  sendTransaction,
  getTransactions
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTransaction)