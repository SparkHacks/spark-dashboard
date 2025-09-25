// scripts/getRoles.ts
import type { UserRecord } from "firebase-admin/auth";

export type RoleFlags = {
  isAdmin: boolean;
  isQrScanner: boolean;
  isWebDev: boolean;
  isDirector: boolean;
};

export default function getRoleFlags(user: UserRecord): RoleFlags {
  const claims = user.customClaims || {};
  return {
    isAdmin: claims.admin === true,
    isQrScanner: claims.qrScanner === true,
    isWebDev: claims.webDev === true,
    isDirector: claims.director === true,
  };
}
