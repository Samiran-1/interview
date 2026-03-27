import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  role: "candidate" | "hr" | "manager";
  company_id: number | null;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  setAuth: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user) => {
        set({ user, isAuthenticated: true });
      },

      login: (user) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        document.cookie = "hireops_session=; path=/; max-age=0;"; // clear auth cookie
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "hireops-auth",
    }
  )
);
