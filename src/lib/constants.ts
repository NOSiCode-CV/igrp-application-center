import { statusSchema } from '@/schemas/global';

export const ROUTES = {
  APPS: '/apps',
  NEW_APPS: '/apps/novo',
  USERS: '/utilizadores',
  USER_ACCOUNT: '/utilizadores/conta',
  DEPARTMENTS: '/departments',
  DEPARTMENTS_ROLE: 'perfil',
  EDIT: '/editar',
} as const;

export const STATUS_OPTIONS = [
  { value: statusSchema.enum.ACTIVE, label: 'Ativo' },
  { value: statusSchema.enum.INACTIVE, label: 'Inativo' },
] as const;

export const OPEN_TYPE_VIEW = 'view';
