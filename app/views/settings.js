import React, { Component } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import OneSignal from 'react-native-onesignal';
import timer from 'react-native-timer';

import AdMob from '../elements/admob';
import SettingsGroup from '../elements/settings-group';

import { countys } from '../utils/locations';
import { OneSignalGetTags } from '../utils/onesignal';
import I18n from '../utils/i18n';
import tracker from '../utils/tracker';

const CHECK_INTERVAL = 60 * 1000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  titleBlock: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 24,
    color: 'black',
  },
  permissionReminderBlock: {
    backgroundColor: '#3949AB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  permissionReminderText: {
    fontSize: 12,
    color: 'white',
  },
  list: {
    paddingVertical: 30,
  },
});


export default class SettingsView extends Component {
  static navigationOptions = {
    header: null,
    tabBarLabel: I18n.t('settings'),
    tabBarIcon: ({ tintColor }) => <Icon name="notifications-none" size={21} color={tintColor} />,
  };

  static requestPermissions() {
    if (Platform.OS === 'ios') {
      const permissions = {
        alert: true,
        badge: true,
        sound: true,
      };
      OneSignal.requestPermissions(permissions);
      OneSignal.registerForPushNotifications();
    }
  }

  state = {
    locations: countys,
    isShowPermissionReminderBlock: false,
  };

  componentDidMount() {
    // Request permission on start
    SettingsView.requestPermissions();
    this.loadEnabledItems();
  }

  async loadEnabledItems() {
    const tags = await OneSignalGetTags();

    this.checkPermissions(tags);
    timer.setInterval(this, 'checkPermissionsInterval', () => this.checkPermissions(tags), CHECK_INTERVAL);
  }

  checkPermissions(tags) {
    if (Platform.OS === 'ios' && tags && Object.values(tags).indexOf('true') !== -1) {
      OneSignal.checkPermissions((permissions) => {
        console.log('checkPermissions', permissions);
        if (!permissions || (permissions && !permissions.alert)) {
          this.setState({ isShowPermissionReminderBlock: true });
        }
      });

      SettingsView.requestPermissions();
    }
  }

  render() {
    tracker.view('Settings');
    return (
      <View style={styles.container}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleText}>{I18n.t('notify_title')}</Text>
        </View>
        {this.state.isShowPermissionReminderBlock &&
          <View style={styles.permissionReminderBlock}>
            <Text style={styles.permissionReminderText}>{I18n.t('permissions_required')}</Text>
          </View>}

        <ScrollView>
          <FlatList
            style={styles.list}
            data={this.state.locations}
            keyExtractor={(item, index) => `${index}-${item}`}
            renderItem={({ item }) => <SettingsGroup groupName={item} />}
          />
        </ScrollView>
        <AdMob unitId="twaqi-ios-settings-footer" />
      </View>
    );
  }
}
