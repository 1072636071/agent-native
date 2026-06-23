import { ExtensionsListPage } from "@agent-native/core/client/extensions";

export function meta() {
  return [{ title: "macros.extensions.metaTitle" }];
}

export default function ExtensionsRoute() {
  return <ExtensionsListPage />;
}
