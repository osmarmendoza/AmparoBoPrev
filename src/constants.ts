import { Permission } from './types';

export const APP_PERMISSIONS: Permission[] = [
  { id: '1', key: 'girls:read', nombre: 'Ver Niñas', descripcion: 'Permite ver el listado y detalles de las niñas.' },
  { id: '2', key: 'girls:write', nombre: 'Crear/Editar Niñas', descripcion: 'Permite crear nuevas fichas o editar las existentes.' },
  { id: '3', key: 'girls:delete', nombre: 'Eliminar Niñas', descripcion: 'Permite borrar registros de niñas del sistema.' },
  { id: '4', key: 'visitas:read', nombre: 'Ver Visitas', descripcion: 'Permite ver el historial de visitas familiares.' },
  { id: '5', key: 'visitas:write', nombre: 'Registrar Visitas', descripcion: 'Permite crear nuevos registros de visitas.' },
  { id: '6', key: 'attendance:read', nombre: 'Ver Asistencia', descripcion: 'Permite ver los reportes de asistencia escolar.' },
  { id: '7', key: 'attendance:write', nombre: 'Registrar Asistencia', descripcion: 'Permite tomar asistencia diaria.' },
  { id: '8', key: 'users:manage', nombre: 'Gestionar Usuarios', descripcion: 'Permite crear, editar y asignar roles a otros usuarios.' },
  { id: '9', key: 'roles:manage', nombre: 'Gestionar Roles', descripcion: 'Permite crear y modificar los tipos de usuario y sus permisos.' },
  { id: '10', key: 'calendar:manage', nombre: 'Gestionar Calendario', descripcion: 'Permite crear eventos en el calendario escolar.' },
];
