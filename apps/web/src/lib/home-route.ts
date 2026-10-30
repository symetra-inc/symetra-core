// Para onde cada perfil vai depois de entrar.
export function homeForRole(role?: string | null): string {
  if (role === "AGENCY_ADMIN" || role === "MASTER") return "/dashboard/agency";
  return "/dashboard";
}
