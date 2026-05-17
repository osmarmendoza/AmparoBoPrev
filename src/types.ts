export type RiskFactor = 
  | 'Acceso a Servicios Básicos y Educación'
  | 'Abuso Verbal, Físico o Sexual'
  | 'Uso de Sustancias o Adicciones en la Familia'
  | 'Extrema Pobreza'
  | 'Familia Disfuncional'
  | 'Otros Factores Medibles';

export interface Girl {
  id: string;
  nombre: string;
  fnac?: string;
  ci?: string;
  ciudad?: string;
  direccion?: string;
  referencia?: string;
  recomendadoPor?: string;
  celular?: string;
  caracteristicas?: string;
  hermanos?: string;
  
  // Apoderados
  apoderadoMasculino?: {
    nombre: string;
    relacion: string;
    ocupacion: string;
    detallesBio: string;
    direccionSiNoVive?: string;
  };
  apoderadaFemenina?: {
    nombre: string;
    relacion: string;
    ocupacion: string;
    detallesBio: string;
  };
  relacionTutores?: string;
  convivencia?: string;

  // Colegio
  colegio?: string;
  gradoEscolar?: string;
  direccionColegio?: string;
  modalidadAnterior?: string;
  materiaFavorita?: string;
  turno?: 'mañana' | 'tarde';

  // Otros
  salud?: string;
  otrasRelaciones?: string; // Ministerios/Iglesias
  comentarios?: string;

  fotoUrl?: string;
  codigoRiesgo: 'rojo' | 'amarillo';
  factoresRiesgo: RiskFactor[];
  descripcionRiesgo?: string;
  tutores?: {
    nombre: string;
    relacion: string;
    telefono: string;
  }[];
}

export interface Visit {
  id: string;
  girlId: string;
  fecha: string;
  staffIds: string[]; // Multiple staff members
  comentarios: string;
  fotoUrl?: string;
  estadoEmocional: string;
  adultosEnCasa?: string;
  estadoFisicoNiña?: string;
  estadoFisicoCasa?: string;
  asistenciaColegio?: string;
  historiaBiblicaRating?: number;
  motivosOracion?: string;
}

export interface AttendanceRecord {
  id: string;
  fecha: string;
  turno: 'mañana' | 'tarde';
  asistencias: {
    girlId: string;
    estado: 'P' | 'A' | 'C'; // Presente, Ausente, Licencia
  }[];
  observaciones?: string;
}

export interface CalendarEvent {
  id: string;
  fecha: string;
  tipo: 'feriado' | 'inconveniente' | 'actividad' | 'taller';
  titulo: string;
  descripcion?: string;
}

export interface Permission {
  id: string;
  nombre: string;
  descripcion: string;
  key: string; // e.g., 'girls:read', 'girls:write', 'users:manage'
}

export interface UserRole {
  id: string;
  nombre: string;
  descripcion: string;
  permissionKeys: string[]; // List of permission keys allowed for this role
}

export interface AppUser {
  uid: string;
  email: string;
  nombre: string;
  puesto?: string;
  telefono?: string;
  rolId: string; // ID of the UserRole
  fotoUrl?: string;
  zonaAsignada?: string;
}
