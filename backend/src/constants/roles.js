/**
 * User roles for RBAC across ODOP Nexus.
 * Must stay in sync with the `role` column in the `profiles` table.
 */
const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

/** Set of all valid roles — handy for validation. */
const VALID_ROLES = new Set(Object.values(ROLES));

export { ROLES, VALID_ROLES };
