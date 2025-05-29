import { create } from "zustand";

export const useStore = create((set) => ({
    theme : localStorage.getItem('theme') || 'light',
    user : JSON.parse(localStorage.getItem('user')) || null,

    setTheme: (theme) => set(() => ({ theme })),
    setCredentials: (user) => set(() => ({ user })),
    logout: () => {
        localStorage.removeItem('user')
        set(() => ({ user: null }))
    }

}));
