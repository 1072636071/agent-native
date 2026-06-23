import { ExtensionViewerPage } from "@agent-native/core/client/extensions";

export function meta() {
  return [{ title: "brain.extensions.pageTitle" }];
}

export default function ExtensionViewerRoute() {
  return <ExtensionViewerPage />;
}
