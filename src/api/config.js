// Dynamic API Base URL resolver for Local & Hostinger Production Deployments
export const getApiUrl = (path) => {
  let base = '';

  if (typeof window !== 'undefined' && import.meta.env.VITE_API_URL) {
    base = import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
};

export const API_BASE = (typeof window !== 'undefined' && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  : '';

export const resolveImgUrl = (url, fallback = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=300&q=80') => {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  let clean = url.trim();

  if (clean.startsWith('data:')) return clean;

  if (clean.includes('/uploads/')) {
    const filename = clean.split('/uploads/').pop();
    return getApiUrl(`/uploads/${filename}`);
  }

  if (clean.includes('/images/')) {
    const relative = clean.split('/images/').pop();
    return `/images/${relative}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;

  const path = clean.startsWith('/') ? clean : `/${clean}`;
  return getApiUrl(path);
};
