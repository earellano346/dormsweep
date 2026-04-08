export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  description?: string;
  createdAt: number;
  sellerEmail: string;
};

export type User = {
  name: string;
  email: string;
};

const LISTINGS_KEY = "dormsweep_listings";
const USER_KEY = "dormsweep_user";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function clearDemoData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LISTINGS_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const u = safeParse<User | null>(localStorage.getItem(USER_KEY), null);
  if (!u || typeof u.name !== "string" || typeof u.email !== "string") return null;
  return u;
}

export function setUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export function getLocalListings(): Listing[] {
  if (typeof window === "undefined") return [];
  const arr = safeParse<Listing[]>(localStorage.getItem(LISTINGS_KEY), []);
  return Array.isArray(arr) ? arr : [];
}

export function addLocalListing(listing: Listing) {
  if (typeof window === "undefined") return;
  const existing = getLocalListings();
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([listing, ...existing]));
}

export function removeLocalListing(id: string) {
  if (typeof window === "undefined") return;
  const existing = getLocalListings();
  const updated = existing.filter((l) => l.id !== id);
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(updated));
}