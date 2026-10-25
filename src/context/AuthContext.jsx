import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as store from '../lib/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => store.currentUser());
  const [data, setData] = useState(() => store.loadData(store.currentUser()?.id));

  // Sinkron antar tab: login/logout/bookmark di tab lain ikut ter-update
  useEffect(() => {
    const onStorage = event => {
      if (event.key && !event.key.startsWith('nf_')) return;
      const next = store.currentUser();
      setUser(next);
      setData(store.loadData(next?.id));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback(async credentials => {
    const next = await store.login(credentials);
    setUser(next); setData(store.loadData(next.id));
    return next;
  }, []);

  const signUp = useCallback(async payload => {
    const next = await store.register(payload);
    setUser(next); setData(store.loadData(next.id));
    return next;
  }, []);

  const signOut = useCallback(() => {
    store.logout();
    setUser(null); setData(store.EMPTY_DATA);
  }, []);

  const updateProfile = useCallback(async patch => {
    if (!user) throw new Error('Belum masuk.');
    const next = await store.updateProfile(user.id, patch);
    setUser(next);
    return next;
  }, [user]);

  const changePassword = useCallback(
    (oldPassword, newPassword) => store.changePassword(user.id, oldPassword, newPassword), [user]);

  const toggleBookmark = useCallback(item => {
    if (user) setData(store.toggleBookmark(user.id, item));
  }, [user]);

  const addHistory = useCallback(item => {
    if (user) setData(store.addHistory(user.id, item));
  }, [user]);

  const removeHistory = useCallback(id => { if (user) setData(store.removeHistory(user.id, id)); }, [user]);
  const clearHistory = useCallback(() => { if (user) setData(store.clearHistory(user.id)); }, [user]);

  const value = useMemo(() => ({
    user,
    bookmarks: data.bookmarks,
    history: data.history,
    isBookmarked: id => data.bookmarks.some(entry => entry.id === String(id)),
    signIn, signUp, signOut, updateProfile, changePassword,
    toggleBookmark, addHistory, removeHistory, clearHistory,
  }), [user, data, signIn, signUp, signOut, updateProfile, changePassword, toggleBookmark, addHistory, removeHistory, clearHistory]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
