import React, {useState, useEffect} from 'react';
import {SafeAreaView, ScrollView, TouchableOpacity, View} from 'react-native';
import Styles from '../../../styles/index';
import { primitives } from "verusid-ts-client"
import { Button, Divider, List, Portal, Text } from 'react-native-paper';
import VerusIdDetailsModal from '../../../components/VerusIdDetailsModal/VerusIdDetailsModal';
import { getIdentity } from '../../../utils/api/channels/verusid/callCreators';
import { unixToDate } from '../../../utils/math';
import { useSelector } from 'react-redux';
import Colors from '../../../globals/colors';
import { VerusIdLogo } from '../../../images/customIcons';
import { openAuthenticateUserModal } from '../../../actions/actions/sendModal/dispatchers/sendModal';
import { AUTHENTICATE_USER_SEND_MODAL } from '../../../utils/constants/sendModal';
import AnimatedActivityIndicatorBox from '../../../components/AnimatedActivityIndicatorBox';
import { getCoinIdFromSystemId } from '../../../utils/CoinData/CoinData';

const LoginRequestInfo = props => {
  const { deeplinkData, sigtime, cancel, signerName } = props
  const req = new primitives.LoginConsentRequest(deeplinkData)
  const [loading, setLoading] = useState(false)
  const [verusIdDetailsModalProps, setVerusIdDetailsModalProps] = useState(null)
  const [sigDateString, setSigDateString] = useState(unixToDate(sigtime))
  const [waitingForSignin, setWaitingForSignin] = useState(false)
  const signedIn = useSelector(state => state.authentication.signedIn)
  const sendModalType = useSelector(state => state.sendModal.type)

  const { system_id, signing_id, challenge } = req
  const chain_id = getCoinIdFromSystemId(system_id)

  const getVerusId = async (chain, iAddrOrName) => {
    const identity = await getIdentity({id: chain}, iAddrOrName);

    if (identity.error) throw new Error(identity.error.message);
    else return identity.result;
  }

  const openVerusIdDetailsModal = (chain, iAddress) => {
    setVerusIdDetailsModalProps({
      loadVerusId: () => getVerusId(chain, iAddress),
      visible: true,
      animationType: 'slide',
      cancel: () => setVerusIdDetailsModalProps(null),
      loadFriendlyNames: async () => {
        try {
          const identityObj = await getVerusId(chain, iAddress);
    
          return getFriendlyNameMap({id: chain}, identityObj);
        } catch (e) {
          return {['i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV']: 'VRSC'};
        }
      },
      iAddress,
      chain
    })
  }

  useEffect(() => {
    if (signedIn && waitingForSignin) {
      props.navigation.navigate("LoginRequestIdentity", {
        deeplinkData
      })
    }
  }, [signedIn, waitingForSignin]);

  useEffect(() => {
    if (sendModalType != AUTHENTICATE_USER_SEND_MODAL) {
      setLoading(false)
    } else setLoading(true)
  }, [sendModalType]);

  handleContinue = () => {
    if (signedIn) {
      props.navigation.navigate("LoginRequestIdentity", {
        deeplinkData
      })
    } else {
      setWaitingForSignin(true)
      openAuthenticateUserModal()
    }
  }

  return loading ? (
    <AnimatedActivityIndicatorBox />
  ) : (
    <SafeAreaView style={Styles.defaultRoot}>
      <Portal>
        {verusIdDetailsModalProps != null && (
          <VerusIdDetailsModal {...verusIdDetailsModalProps} />
        )}
      </Portal>
      <ScrollView
        style={Styles.fullWidth}
        contentContainerStyle={Styles.focalCenter}>
        <VerusIdLogo width={'55%'} height={'10%'} />
        <View style={Styles.wideBlock}>
          <Text style={{fontSize: 20, textAlign: 'center'}}>
            {`${signerName}@ is requesting login with VerusID`}
          </Text>
        </View>
        <View style={Styles.fullWidth}>
          <TouchableOpacity
            onPress={() => openVerusIdDetailsModal(chain_id, signing_id)}>
            <List.Item
              title={`${signerName}@`}
              description={'Requested by'}
              right={props => (
                <List.Icon {...props} icon={'information'} size={20} />
              )}
            />
            <Divider />
          </TouchableOpacity>
          <TouchableOpacity>
            <List.Item
              title={'View your chosen identity'}
              description={'This will allow them to'}
            />
            <Divider />
          </TouchableOpacity>
          <TouchableOpacity>
            <List.Item title={chain_id} description={'System name'} />
            <Divider />
          </TouchableOpacity>
          <TouchableOpacity>
            <List.Item title={sigDateString} description={'Signed on'} />
            <Divider />
          </TouchableOpacity>
        </View>
        <View
          style={{
            ...Styles.fullWidthBlock,
            paddingHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            display: 'flex',
          }}>
          <Button
            color={Colors.warningButtonColor}
            style={{width: 148}}
            onPress={() => cancel()}>
            Cancel
          </Button>
          <Button
            color={Colors.verusGreenColor}
            style={{width: 148}}
            onPress={() => handleContinue()}>
            Continue
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginRequestInfo;
