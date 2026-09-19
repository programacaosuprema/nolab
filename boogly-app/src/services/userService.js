// 🔥 helper padrão (reutilizável)
async function safeParse(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Resposta inválida (não é JSON)');
  }
}

// 🔥 GET /users/me
export async function getMe({ domainUrl }) {
  const res = await fetch(`${domainUrl}/users/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await safeParse(res);

  if (!res.ok) {
    throw new Error(`Erro /users/me (${res.status})`);
  }

  return data; // 🔥 sempre user completo
}

export async function getUserChallenges({ domainUrl }) {
  const meData = await getMe({ domainUrl });

  return meData?.userChallenges || meData?.challenges || [];
}

export async function updateOnboarding({ domainUrl, onboardingDone }) {
  const res = await fetch(`${domainUrl}/users/me/onboarding`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ onboardingDone }),
  });

  const data = await safeParse(res);

  if (!res.ok) {
    throw new Error(`Erro onboarding (${res.status})`);
  }

  return data;
}

export async function fetchMe({ domainUrl }) {
  return getMe({ domainUrl }); // ✔ perfeito
}

export async function checkOnboarding({ domainUrl }) {
  const user = await fetchMe({ domainUrl });

  return user?.onboardingDone === true;
}
