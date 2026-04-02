import bcrypt from 'bcryptjs';

export type DevAuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  nicNumber?: string;
  address?: string;
  identityCardImage?: string;
  role: 'user' | 'admin';
};

type DevAuthStore = {
  users: DevAuthUser[];
};

declare global {
  // eslint-disable-next-line no-var
  var devAuthStore: DevAuthStore | undefined;
}

function getStore(): DevAuthStore {
  if (!globalThis.devAuthStore) {
    globalThis.devAuthStore = { users: [] };
  }
  return globalThis.devAuthStore;
}

export function shouldUseDevAuthFallback(error: unknown): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  return /ENOTFOUND|querySrv|ECONNREFUSED|MongoServerSelectionError/i.test(message);
}

export async function createDevUser(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  nicNumber?: string;
  address?: string;
  identityCardImage?: string;
  role?: 'user' | 'admin';
}): Promise<DevAuthUser> {
  const store = getStore();

  const existing = store.users.find((u) => u.email === input.email);
  if (existing) {
    throw new Error('User already exists with this email');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const user: DevAuthUser = {
    id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    nicNumber: input.nicNumber || '',
    address: input.address || '',
    identityCardImage: input.identityCardImage || '',
    role: input.role || 'user',
  };

  store.users.push(user);
  return user;
}

export function findDevUserByEmail(email: string): DevAuthUser | undefined {
  return getStore().users.find((u) => u.email === email);
}

export function findDevUserById(id: string): DevAuthUser | undefined {
  return getStore().users.find((u) => u.id === id);
}

export async function verifyDevUserPassword(
  user: DevAuthUser,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}