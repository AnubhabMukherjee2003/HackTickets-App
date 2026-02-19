import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  phone: string;
  isAdmin: boolean;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, phone: string, isAdmin: boolean) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('ht_token');
    const phone = localStorage.getItem('ht_phone');
    const isAdmin = localStorage.getItem('ht_isAdmin') === 'true';
    if (token && phone) {
      setUser({ token, phone, isAdmin });
    }
  }, []);

  const login = (token: string, phone: string, isAdmin: boolean) => {
    localStorage.setItem('ht_token', token);
    localStorage.setItem('ht_phone', phone);
    localStorage.setItem('ht_isAdmin', String(isAdmin));
    setUser({ token, phone, isAdmin });
  };

  const logout = () => {
    localStorage.removeItem('ht_token');
    localStorage.removeItem('ht_phone');
    localStorage.removeItem('ht_isAdmin');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
