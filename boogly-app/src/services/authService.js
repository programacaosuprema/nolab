// src/services/authService.js

// 🔥 helper reutilizável (igual ao userService)
async function safeParse(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Resposta inválida (não é JSON)');
  }
}

export async function authenticateUser({ domainUrl, identifier }) {
  const res = await fetch(`${domainUrl}/auth`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: identifier }),
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Resposta inválida do servidor');
  }
  if (!res.ok) throw new Error(data?.error || 'Erro na autenticação');
  return data;
}

export async function loginGuest({ domainUrl }) {
  const res = await fetch(`${domainUrl}/auth/guest`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await safeParse(res);

  if (!res.ok) {
    throw new Error(`Erro guest (${res.status})`);
  }

  return data; // opcional: backend pode retornar user
}

export async function logoutUser({ domainUrl }) {
  try {
    const res = await fetch(`${domainUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // 🔥 evita quebrar se backend não tiver rota
    if (!res.ok) {
      console.warn(`Logout falhou (${res.status})`);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro de rede no logout:', err.message);
    return false;
  }
}
