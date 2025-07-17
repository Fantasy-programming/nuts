import PostHog from "posthog-react-native";

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string,
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST as string,

    // If you want to use Session Replay, uncomment the following lines 👇
    // enableSessionReplay: true,
    // sessionReplayConfig: {
    //   // Whether text inputs are masked. Default is true.
    //   // Password inputs are always masked regardless
    //   maskAllTextInputs: true,
    //   // Whether images are masked. Default is true.
    //   maskAllImages: true,
    //   // Capture logs automatically. Default is true.
    //   // Android only (Native Logcat only)
    //   captureLog: true,
    //   // Whether network requests are captured in recordings. Default is true
    //   // Only metric-like data like speed, size, and response code are captured.
    //   // No data is captured from the request or response body.
    //   // iOS only
    //   captureNetworkTelemetry: true,
    //   // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 500ms
    //   androidDebouncerDelayMs: 500,
    //   // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 1000ms
    //   iOSdebouncerDelayMs: 1000,
    // },
  },
);
