// constants.ts - Store app-wide constants here

export const APP_NAME = "My Awesome App";
export const API_BASE_URL = "https://api.example.com";

// Example of user roles
export const USER_ROLES = {
  ADMIN: 1,
  TEACHER: 2,
  STUDENT: 3,
} as const;

// Example permissions list
// Exporting types from another file
export type { UserData, Permission, Class, Section } from "./constants/types";
