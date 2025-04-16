/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {enableScreens} from 'react-native-screens';
import {PaperProvider} from 'react-native-paper';
import {I18nextProvider} from 'react-i18next';
import AppNavigator from './src/navigation/AppNavigator.tsx';
import i18n from './src/i18n';

enableScreens();

export default function App() {
    return (
        <PaperProvider>
            <I18nextProvider i18n={i18n}>
                <AppNavigator />
            </I18nextProvider>
        </PaperProvider>);
}
