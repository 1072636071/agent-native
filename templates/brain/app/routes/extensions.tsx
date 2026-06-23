import { Outlet } from "react-router";

export function meta() {
  return [{ title: "brain.extensions.pageTitle" }];
}

export default function ExtensionsLayout() {
  return <Outlet />;
}
