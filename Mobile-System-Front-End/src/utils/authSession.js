const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const now = () => Date.now();

const parseAdmin = () => {
  const raw = localStorage.getItem('admin');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem('admin');
    return null;
  }
};

const clearCustomerSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  localStorage.removeItem('email');
  localStorage.removeItem('customerAuthExpiresAt');
};

const clearAdminSession = () => {
  localStorage.removeItem('admin');
};

export const setCustomerSession = ({ token, role, name, email }) => {
  if (token) localStorage.setItem('token', token);
  localStorage.setItem('role', role || 'customer');
  if (name) localStorage.setItem('name', name);
  if (email) localStorage.setItem('email', email);
  localStorage.setItem('customerAuthExpiresAt', String(now() + SEVEN_DAYS_MS));
};

export const setAdminSession = (adminData) => {
  if (!adminData) return;
  localStorage.setItem('admin', JSON.stringify(adminData));
};

export const isCustomerSessionActive = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const expiresAt = Number(localStorage.getItem('customerAuthExpiresAt'));

  if (!token && !role) return false;
  if (!expiresAt || now() > expiresAt) {
    clearCustomerSession();
    return false;
  }

  return true;
};

export const isAdminSessionActive = () => {
  const admin = parseAdmin();

  if (!admin) return false;

  return true;
};

export const cleanupExpiredSessions = () => {
  isCustomerSessionActive();
  isAdminSessionActive();
};

export const isAnySessionActive = () => {
  return isCustomerSessionActive() || isAdminSessionActive();
};

export const clearAllSessions = () => {
  clearCustomerSession();
  clearAdminSession();
};
