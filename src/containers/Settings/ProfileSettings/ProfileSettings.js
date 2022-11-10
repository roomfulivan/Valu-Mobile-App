/*
  This component is meant to be the overview screen for 
  the user profile settings menu. It provides the user
  with all configurable settings they have access to for 
  their user account. This includes changing passwords, 
  deleting accounts etc.
*/

import React, { Component } from "react";
import { CommonActions } from '@react-navigation/native';
import { Divider, List, Portal } from "react-native-paper"
import { 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView
} from "react-native";
import { connect } from 'react-redux';
import Styles from '../../../styles/index'
import {
  getSupportedBiometryType,
  removeBiometricPassword,
  storeBiometricPassword
} from "../../../utils/keychain/keychain";
import {
  addEncryptedKey,
  setBiometry,
  setKeyDerivationVersion,
  signOut,
} from "../../../actions/actionCreators";
import PasswordCheck from "../../../components/PasswordCheck";
import {
  canEnableBiometry,
  canShowSeed,
} from "../../../actions/actions/channels/dlight/dispatchers/AlertManager";
import { createAlert, resolveAlert } from "../../../actions/actions/alert/dispatchers/alert";
import { checkPinForUser } from "../../../utils/asyncStore/asyncStore";
import { ENABLE_DLIGHT, APP_VERSION } from '../../../../env/index'
import { dlightEnabled } from "../../../utils/enabledChannels";
import SetupSeedModal from "../../../components/SetupSeedModal/SetupSeedModal";
import { DLIGHT_PRIVATE } from "../../../utils/constants/intervalConstants";
import ListSelectionModal from "../../../components/ListSelectionModal/ListSelectionModal";

const RESET_PWD = "ResetPwd"
const REMOVE_PROFILE = "DeleteProfile"

class ProfileSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalFiatBalance: 0,
      coinRates: {},
      loading: false,
      passwordDialogOpen: false,
      passwordDialogTitle: "",
      supportedBiometryType: {
        display_name: null,
        biometry: false,
      },
      privateSeedModalOpen: false,
      keyDerivationVersionModalOpen: false,
      onPasswordCorrect: () => {},
    };

    this.KEY_DERIVATION_VERSION_LABELS = {
      [0]: "<= 0.2.1-beta",
      [1]: APP_VERSION
    }
  }

  _openSettings = (screen) => {
    let navigation = this.props.navigation;

    navigation.navigate(screen);
  };

  async componentDidMount() {
    this.setState({ supportedBiometryType: await getSupportedBiometryType() });
  }

  closePasswordDialog = (cb) => {
    this.setState(
      {
        passwordDialogOpen: false,
        onPasswordCorrect: () => {},
      },
      cb
    );
  };

  resetToScreen = (route, title, data, fullReset) => {
    let resetAction

    if (fullReset) {
      resetAction = CommonActions.reset({
        index: 0, // <-- currect active route from actions array
        routes: [
          { name: route, params: { data: data } },
        ],
      })
    } else {
      resetAction = CommonActions.reset({
        index: 1, // <-- currect active route from actions array
        routes: [
          { name: "Home" },
          { name: route, params: { title: title, data: data } },
        ],
      })
    }

    this.props.navigation.closeDrawer();
    this.props.navigation.dispatch(resetAction)
  }

  toggleBiometry = async (passwordCheck) => {
    if (passwordCheck.valid) {
      const { activeAccount } = this.props;
      const { supportedBiometryType } = this.state;
      const { biometry, accountHash, id } = activeAccount;

      this.closePasswordDialog(async () => {
        try {
          if (accountHash == null)
            throw new Error("No account hash for profile: " + id);

          if (biometry) {
            await removeBiometricPassword(accountHash);
            this.props.dispatch(await setBiometry(id, false));
            createAlert(
              "Success",
              `${
                supportedBiometryType.display_name
              } authentication disabled for profile "${id}"`
            );
          } else {
            await storeBiometricPassword(accountHash, passwordCheck.password);
            this.props.dispatch(await setBiometry(id, true));
            createAlert(
              "Success",
              `${
                supportedBiometryType.display_name
              } authentication enabled for profile "${id}"`
            );
          }
        } catch (e) {
          console.warn(e);
          createAlert(
            "Error",
            `Failed to ${
              biometry ? "disable" : "enable"
            } biometric authentication (${supportedBiometryType.display_name}).`
          );
        }
      });
    } else {
      createAlert("Authentication Error", "Incorrect password");
    }
  };

  canSetUserKeyDerivationVersion = () => {
    return createAlert(
      'Change key derivation version?',
      "Changing the key derivation version will change how your addresses are derived from your " + 
      "seed for this profile. This will log you out.",
      [
        {
          text: 'No',
          onPress: () => resolveAlert(false),
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => resolveAlert(true)},
      ],
      {
        cancelable: true,
      },
    )
  }

  setUserKeyDerivationVersion = async (keyDerivationVersion) => {
    if (
      keyDerivationVersion !== this.props.activeAccount.keyDerivationVersion &&
      (await this.canSetUserKeyDerivationVersion())
    ) {
      const { activeAccount } = this.props;
      const { id } = activeAccount;

      this.props.dispatch(
        await setKeyDerivationVersion(id, keyDerivationVersion)
      );
      this.resetToScreen(
        "SecureLoading",
        null,
        {
          task: () => {
            // Hack to prevent crash on screens that require activeAccount not to be null
            // TODO: Find a more elegant solution
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                this.props.dispatch(signOut());
                resolve();
              }, 1000);
            });
          },
          message: "Signing out...",
          route: "Home",
          successMsg: "Signed out",
          errorMsg: "Failed to sign out",
        },
        true
      );
    }
  };

  showSeed = async (passwordCheck) => {
    if (passwordCheck.valid) {
      const { activeAccount } = this.props;
      const { id } = activeAccount;

      this.closePasswordDialog(async () => {
        checkPinForUser(passwordCheck.password, id)
          .then((seeds) => {
            this.setState({ password: null }, () => {
              this.props.navigation.navigate("DisplaySeed", {
                data: { seeds },
              });
            });
          })
          .catch((e) => {
            console.warn(e);
          });
      });
    } else {
      createAlert("Authentication Error", "Incorrect password");
    }
  };

  openKeyDerivationVersionModal = () => {
    this.setState({
      keyDerivationVersionModalOpen: true
    })
  }

  closeKeyDerivationVersionModal = () => {
    this.setState({
      keyDerivationVersionModalOpen: false
    })
  }

  addZSeed = (seed, channel) => {
    this.openPasswordCheck((result) => {
      if (result.valid) {
        this.closePasswordDialog(async () => {
          try {
            await addEncryptedKey(
              this.props.activeAccount.accountHash,
              channel,
              seed,
              result.password
            );
  
            createAlert(
              "Success",
              `Z Seed set for ${
                this.props.activeAccount.id
              }. Restart Verus Mobile and login to start using Z cards!`
            );
          } catch(e) {
            createAlert("Error", e.message);
          }
        })
      } else {
        createAlert("Authentication Error", "Incorrect password");
      }
    })
  }

  openPasswordCheck = (onPasswordCorrect) =>
    this.setState({
      passwordDialogOpen: true,
      passwordDialogTitle: `Enter password for "${
        this.props.activeAccount.id
      }"`,
      onPasswordCorrect,
    });

  renderSettingsList = () => {
    const zSetupComplete = dlightEnabled()

    return (
      <ScrollView style={Styles.fullWidth}>
        <Portal>
          <SetupSeedModal
            animationType="slide"
            transparent={false}
            visible={this.state.privateSeedModalOpen}
            cancel={() => {
              this.setState({ privateSeedModalOpen: false });
            }}
            setSeed={(seed, channel) => this.addZSeed(seed, channel)}
            channel={DLIGHT_PRIVATE}
          />
          {this.state.keyDerivationVersionModalOpen && (
            <ListSelectionModal
              flexHeight={1}
              title="Key Derivation Versions"
              selectedKey={this.props.activeAccount.keyDerivationVersion}
              visible={this.state.keyDerivationVersionModalOpen}
              onSelect={(item) => this.setUserKeyDerivationVersion(item.key)}
              data={Object.keys(this.KEY_DERIVATION_VERSION_LABELS).map(
                (key) => {
                  return {
                    key: Number(key),
                    title: this.KEY_DERIVATION_VERSION_LABELS[key],
                    description:
                      this.KEY_DERIVATION_VERSION_LABELS[key] === APP_VERSION
                        ? "Latest"
                        : "Legacy",
                  };
                }
              )}
              cancel={() => this.closeKeyDerivationVersionModal()}
            />
          )}
        </Portal>
        {/* TODO: Add back in when more interesting profile data and/or settings are implemented
          <TouchableOpacity onPress={() => this._openSettings(PROFILE_INFO)}>
            <ListItem                       
              title={<Text style={styles.coinItemLabel}>Profile Info</Text>}
              leftIcon={{name: 'info'}}
              containerStyle={{ borderBottomWidth: 0 }} 
            />
          </TouchableOpacity>*/}
        <List.Subheader>{"Current Profile"}</List.Subheader>
        <Divider />
        <List.Item
          title={this.props.activeAccount.id}
          description={"Logged In"}
          left={(props) => <List.Icon {...props} icon={"account"} />}
        />
        <Divider />
        <List.Subheader>{"Security Settings"}</List.Subheader>
        <TouchableOpacity
          onPress={async () => {
            if (await canShowSeed()) this.openPasswordCheck(this.showSeed);
          }}
        >
          <Divider />
          <List.Item
            title={"Recover Seed"}
            left={(props) => <List.Icon {...props} icon={"lock-open"} />}
            right={(props) => (
              <List.Icon {...props} icon={"chevron-right"} size={20} />
            )}
          />
          <Divider />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this._openSettings(RESET_PWD)}>
          <List.Item
            title={"Change Password"}
            left={(props) => <List.Icon {...props} icon={"lock-reset"} />}
            right={(props) => (
              <List.Icon {...props} icon={"chevron-right"} size={20} />
            )}
          />
          <Divider />
        </TouchableOpacity>
        {(this.props.activeAccount.biometry ||
          this.state.supportedBiometryType.biometry) && (
          <TouchableOpacity
            onPress={async () => {
              if (this.props.activeAccount.biometry) {
                this.openPasswordCheck(this.toggleBiometry);
              } else if (await canEnableBiometry())
                this.openPasswordCheck(this.toggleBiometry);
            }}
          >
            <List.Item
              title={`${
                this.props.activeAccount.biometry ? "Disable" : "Setup"
              } Biometric Authentication`}
              left={(props) => <List.Icon {...props} icon={"lock"} />}
            />
            <Divider />
          </TouchableOpacity>
        )}
        <List.Subheader>{"Key Settings"}</List.Subheader>
        <TouchableOpacity
          onPress={() => this.openKeyDerivationVersionModal()}
          style={{ ...Styles.flex }}
        >
          <Divider />
          <List.Item
            title={"Key Derivation Version"}
            right={() => (
              <Text style={Styles.listItemTableCell}>
                {
                  this.KEY_DERIVATION_VERSION_LABELS[
                    this.props.activeAccount.keyDerivationVersion
                  ]
                }
              </Text>
            )}
          />
          <Divider />
        </TouchableOpacity>
        <PasswordCheck
          cancel={() => this.closePasswordDialog()}
          submit={(result) => this.state.onPasswordCorrect(result)}
          visible={this.state.passwordDialogOpen}
          title={this.state.passwordDialogTitle}
          userName={this.props.activeAccount.id}
          account={this.props.activeAccount}
          allowBiometry={true}
        />
        <List.Subheader>{"Profile Actions"}</List.Subheader>
        {ENABLE_DLIGHT && (
          <TouchableOpacity
            onPress={() => {
              this.setState({ privateSeedModalOpen: true });
            }}
            disabled={zSetupComplete}
          >
            <Divider />
            <List.Item
              title={
                zSetupComplete
                  ? "Z Seed Setup Complete"
                  : "Setup Z (Shielded Address) Seed"
              }
              description={
                zSetupComplete
                  ? ""
                  : "Setting up a Z Seed will allow you to use private transactions on compatible coins (after a restart)"
              }
              left={(props) => <List.Icon {...props} icon={"shield-key"} />}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => this._openSettings(REMOVE_PROFILE)}>
          <Divider />
          <List.Item
            title={"Delete Profile"}
            left={(props) => <List.Icon {...props} icon={"trash-can"} />}
            right={(props) => <List.Icon {...props} icon={"chevron-right"} />}
          />
          <Divider />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  render() {
    return <View style={Styles.defaultRoot}>{this.renderSettingsList()}</View>;
  }
}

const mapStateToProps = (state) => {
  return {
    activeAccount: state.authentication.activeAccount,
  }
};

export default connect(mapStateToProps)(ProfileSettings);
