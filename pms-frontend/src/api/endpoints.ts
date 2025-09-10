/**
 * api/endpoints.ts
 * ----------------
 * Centralized endpoint strings for consistent usage across UI.
 */
export const endpoints = {
  health: '/healthz',
  userExists: '/auth/exists',
  //otpRequest: '/auth/otp/request',
  otpVerify: '/auth/otp/verify',
  me: '/me',
  myKpis: '/me/kpis',
  myProjects: '/my/projects',
  projectModules: (id: string) => `/projects/${id}/modules`,
};
