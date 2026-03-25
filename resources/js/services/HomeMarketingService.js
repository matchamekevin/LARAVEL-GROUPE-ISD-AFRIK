import api from '../axios';

export async function getHomeMarketingCards(params = {}) {
  const res = await api.get('/home-marketing-cards', { params });
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
