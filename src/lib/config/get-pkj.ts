import { IGRPPackageJson } from "@igrp/framework-next-types";
import pkg from "../../../package.json";

export function getPackageJson() {
  const appInfo: IGRPPackageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  };
  return appInfo;
}
