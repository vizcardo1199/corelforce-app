/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import * as Sentry from "@sentry/react-native";

Sentry.init({
    dsn: "https://54fb95a9198c88f700cc0a1c598ddc22@o4509256796340224.ingest.us.sentry.io/4509256798568448",
    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,
    integrations: [],
});
AppRegistry.registerComponent(appName, () => App);
