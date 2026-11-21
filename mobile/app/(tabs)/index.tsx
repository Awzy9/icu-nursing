import { Redirect } from "expo-router";

/** Keep the app's root deep link usable, without making every Home action resolve to '/'. */
export default function InitialRoute() {
  return <Redirect href="/(tabs)/home" />;
}
