// Mirrors the Go API response shapes (Slice 1).

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: string;
  status: string;
  is_active: boolean;
  permissions?: string[]; // "module:action"
}

export interface User {
  id: string;
  role_id: string;
  parent_user_id: string | null;
  name: string;
  email: string | null;
  phone: string; // always present — phone is a required field
  username: string | null;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ListUsers row: embedded user + joined role + per-user brand access codes.
export interface UserRow {
  user: User;
  role_code: string;
  role_name: string;
  role_tier: string;
  brand_codes: string[];
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  scope: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  tier: "platform" | "internal" | "external";
  is_system: boolean;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string | null;
}

export interface Override {
  module: string;
  action: string;
  granted: boolean;
}

export interface UserPermissions {
  effective: string[]; // "module:action"
  overrides: Override[];
}
