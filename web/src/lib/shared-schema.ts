export type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status: string;
  distributorId?: number | null;
  assignedDistributorId?: number | null;
  profileImage?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  sku?: string | null;
  stock?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type Inventory = {
  id: number;
  productId?: number | null;
  quantity?: number | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type InstallerApplication = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
  shopName?: string | null;
  experience?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type WarrantyRegistration = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  vehicleName?: string | null;
  vehicleModel?: string | null;
  registrationNumber?: string | null;
  productName?: string | null;
  installationDate?: Date | string | null;
  status?: string | null;
  distributorId?: number | null;
  dealerId?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type PpfPartnerApplication = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};

export type Partner = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  type?: string | null;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
};
