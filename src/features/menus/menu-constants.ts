import { menuTargetSchema, menuTypeSchema } from './menu-schemas';

export const menuTypeOptions = [
  { value: menuTypeSchema.enum.MENU_PAGE, label: 'Página Interna' },
  { value: menuTypeSchema.enum.EXTERNAL_PAGE, label: 'Página Externa' },
  { value: menuTypeSchema.enum.FOLDER, label: 'Grupo (Pasta)' },
] as const;

export const menuTargetOptions = [
  { value: menuTargetSchema.enum._self, label: 'Neste separador' },
  { value: menuTargetSchema.enum._blank, label: 'Novo separador' },
] as const;

export const MENU_VIEW = 'view';
