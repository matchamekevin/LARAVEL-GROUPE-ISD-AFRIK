import api from '../axios';

export async function getHomeTestimonials(params = {}) {
  const res = await api.get('/home-testimonials', { params });
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
