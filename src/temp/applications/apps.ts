import type { IGRPApplicationArgs } from "@igrp/framework-next-types";

export const IGRP_MOCK_APPS_DATA: IGRPApplicationArgs[] = [
  {
    id: 35,
    code: "APP_TEST_1",
    name: "test 1",
    description: null,
    status: "ACTIVE",
    type: "INTERNAL",
    owner: "superadmin",
    picture: "",
    url: null,
    slug: "test-1",
    departments: ["DEPT_IGRP"],
  },
  {
    id: 36,
    code: "APP_TESTE_2",
    name: "test 2",
    description: "teste app ",
    status: "ACTIVE",
    type: "INTERNAL",
    owner: "superadmin",
    picture: "",
    url: null,
    slug: "test-2",
    departments: ["DEPT_IGRP"],
  },
];
