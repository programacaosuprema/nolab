import { normalizeError } from './errorHandler';

export async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      throw {
        response: {
          status: res.status,
          data,
        },
      };
    }

    return await res.json();
  } catch (error) {
    throw normalizeError(error);
  }
}
