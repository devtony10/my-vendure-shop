import { addNavMenuItem } from "@vendure/admin-ui/core";

export default [
  addNavMenuItem(
    {
      id: "doordash-config",
      label: "Doordash",
      routerLink: ["/extensions/doordash-config"],
      icon: "truck",
    },
    "sales"
  ),
];
