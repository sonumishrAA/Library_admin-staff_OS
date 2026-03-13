import { createContext, useContext, useMemo, useState } from "react";
import { portalApi } from "../lib/api";

const STORAGE_KEY = "libraryos_portal_session";
const AuthContext = createContext(null);

const loadSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSession = (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export function AuthProvider({ children }) {
  const initialSession = loadSession();
  const [token, setToken] = useState(initialSession?.token || "");
  const [user, setUser] = useState(initialSession?.user || null);
  const [libraries, setLibraries] = useState(initialSession?.libraries || []);
  const [selectedLibraryId, setSelectedLibraryId] = useState(
    initialSession?.selectedLibraryId || "",
  );

  const persist = (next) => {
    saveSession(next);
    setToken(next.token || "");
    setUser(next.user || null);
    setLibraries(next.libraries || []);
    setSelectedLibraryId(next.selectedLibraryId || "");
  };

  const login = async ({ identifier, password }) => {
    const response = await portalApi.login({ identifier, password });
    console.log("[AuthContext] Full Login Response:", response);
    console.log("[AuthContext] Token Check:", {
      tokenLength: response.token?.length || 0,
      tokenParts: response.token?.split(".").length || 0,
      libraries: response.libraries?.length || 0,
      user: response.user,
    });
    const nextSelected =
      response.direct_open_library_id || response.libraries?.[0]?.id || "";
    const nextSession = {
      token: response.token,
      user: response.user,
      libraries: response.libraries || [],
      selectedLibraryId: nextSelected,
    };
    persist(nextSession);
    return response;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setUser(null);
    setLibraries([]);
    setSelectedLibraryId("");
  };

  const selectLibrary = (libraryId) => {
    const nextSession = {
      token,
      user,
      libraries,
      selectedLibraryId: libraryId,
    };
    persist(nextSession);
  };

  const replaceLibraries = (nextLibraries) => {
    const nextSession = {
      token,
      user,
      libraries: nextLibraries,
      selectedLibraryId: selectedLibraryId || nextLibraries?.[0]?.id || "",
    };
    persist(nextSession);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      libraries,
      selectedLibraryId,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      selectLibrary,
      replaceLibraries,
    }),
    [token, user, libraries, selectedLibraryId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
};
