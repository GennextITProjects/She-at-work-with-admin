// src/routes.ts  ← replace your existing routes.ts with this entire file

import { Role } from "./validaton-schema";

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
export const apiAuthPrefix          = "/api/auth";
export const publicRoutePattern = /^(\/|\/auth\/verify-email|\/about(\/.*)?|\/press(\/.*)?|\/news(\/.*)?|\/blogs(\/.*)?|\/entrechat(\/.*)?|\/events(\/.*)?|\/contact|\/share-your-story|\/gettingstarted(\/.*)?)$/

export const publicApiPrefixes: string[] = [
  "/api/contact-submissions",
  "/api/content",
  "/api/stories",
];

export const authRoutes: string[] = [
  "/auth/error",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export const protectedRoutes: { pattern: RegExp; roles: Role[] }[] = [
  { pattern: /^\/dashboard\/admin(\/.*)?$/, roles: ["ADMIN"] },
  { pattern: /^\/dashboard\/user(\/.*)?$/,  roles: ["USER"] },
];