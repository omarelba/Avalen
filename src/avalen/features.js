// What the iPhone app shows during the pilot. Integrations that the iPhone app doesn't
// support yet stay in the code but are hidden there:
//   - wearable connections and automatic sync (Apple Health, Health Connect, WHOOP,
//     Google Health). Readings entered by hand still work.
//   - online payment through Paymob. Payment requests and payments recorded by the
//     coach still work.
// A later iPhone build can switch either back on with VITE_AVALEN_WEARABLE_SYNC=on or
// VITE_AVALEN_ONLINE_PAYMENTS=on. The web app is unchanged.

// Capacitor defines window.Capacitor inside the iPhone app; a browser never has it.
// Read once and remembered: loading a Capacitor plugin later (haptics) replaces the global
// in a browser, and the answer must not change during a session.
let native;
export const inNativeApp = () => (native ??= Boolean(globalThis.Capacitor?.isNativePlatform?.()));

// Wearables are on hold during the pilot. While off, the app shows no wearable
// connections, readings, widgets or wording anywhere (web and iPhone), and makes no
// wearable requests. The server code and any stored readings stay as they are.
// Build with VITE_AVALEN_WEARABLES=on to bring them back. In development only (the
// browser tests), localStorage "avalen:feature:wearables" = "on" turns them on too.
export const wearablesEnabled = () => import.meta.env?.VITE_AVALEN_WEARABLES === "on" || devOverride("wearables");
function devOverride(name) {
  if (!import.meta.env?.DEV) return false;
  try { return globalThis.localStorage?.getItem(`avalen:feature:${name}`) === "on"; } catch { return false; }
}

export const wearableSync = () => !inNativeApp() || import.meta.env?.VITE_AVALEN_WEARABLE_SYNC === "on";
export const onlinePayments = () => !inNativeApp() || import.meta.env?.VITE_AVALEN_ONLINE_PAYMENTS === "on";
