"use server";

import {
  type IGRPSetLocaleResult,
  igrpSetLocale,
} from "@igrp/framework-next/i18n/server";

import { i18n } from "./index";

/** Language change. Passed to `IGRPLocaleSwitcher` as its `action`. */
export async function setLocale(value: string): Promise<IGRPSetLocaleResult> {
  return igrpSetLocale(i18n, value);
}
