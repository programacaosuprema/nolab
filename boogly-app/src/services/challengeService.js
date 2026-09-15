export async function createAttempt({ 
    domainUrl, 
    id 
}) {
  const res = await fetch(`${domainUrl}/challenges/${id}/attempt`, {
    method: "POST",
    credentials: "include", 
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.userAttempt ?? null;
}

export async function submitChallenge({
  domainUrl,
  id,
  commands
}) {
  const res = await fetch(`${domainUrl}/challenges/${id}/submit`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ commands })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.message || "Erro ao submeter");
  }

  const data = await res.json();
  return data;
}

export async function getChallenge({ domainUrl, id }) {
  const res = await fetch(`${domainUrl}/challenges/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("Erro ao carregar desafio");
  }

  const data = await res.json();

  // 🔥 normalização já dentro do service (melhor ainda)
  return {
    ...data,
    structure: data.structure || "list",
    userStatus: data.userStatus || "pending",
    userAttempts: data.userAttempts ?? 0
  };
}

export async function getChallenges({ domainUrl, structure }) {
  const headers = { "Content-Type": "application/json" };

  const res = await fetch(
    `${domainUrl}/challenges?structure=${structure}`,
    {
      method: "GET",
      credentials: "include",
      headers
    }
  );

  if (!res.ok) {
    throw new Error("Erro ao carregar desafios");
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("Formato inválido da resposta");
  }

  return data;
}