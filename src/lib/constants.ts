export const ROLES = {
  ADMIN: "ADMIN",
  CONSULTANT: "CONSULTANT",
  CLIENT: "CLIENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  CONSULTANT: "Consultor",
  CLIENT: "Cliente",
};

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "mgv_session";
export const SESSION_DURATION_DAYS = 30;
