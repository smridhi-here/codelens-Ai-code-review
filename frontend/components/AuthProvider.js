"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until we've read localStorage

  useEffect(() => {
    setUser(api.getStoredUser());
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    setUser({ name: data.name, email: data.email });
  }

  async function signup(name, email, password) {
    const data = await api.signup(name, email, password);
    setUser({ name: data.name, email: data.email });
  }

  function logout() {
    api.clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
