import { IGRPUserArgs } from '@igrp/framework-next-types';
import { IGRP_MOCK_USER } from './user';

export const getMockUser = (): { mockUser: IGRPUserArgs } => {
  return {
    mockUser: IGRP_MOCK_USER,
  };
};
