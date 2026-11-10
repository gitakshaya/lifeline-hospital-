import { Alert, Platform } from 'react-native';

// Alert.alert does nothing in the browser, so fall back to window.alert there
export function notify(title, message) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}
