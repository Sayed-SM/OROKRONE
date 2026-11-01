const cleanName = (value, field) => {
  const name = String(value ?? '').trim();
  if (name.length < 2 || name.length > 80) throw new Error(`invalid_${field}`);
  return name;
};

export function normalizeShippingRate(rate = {}) {
  const governorate = cleanName(rate.governorate, 'governorate');
  const governorate_en = cleanName(rate.governorate_en, 'governorate_en');
  const fee = Number(rate.fee);
  if (!Number.isFinite(fee) || fee < 0 || fee > 100000) throw new Error('invalid_shipping_fee');

  return {
    governorate,
    governorate_en,
    fee: Math.round(fee * 100) / 100,
    active: typeof rate.active === 'boolean' ? rate.active : true,
  };
}

export function activeShippingRates(rates = []) {
  return Array.isArray(rates) ? rates.filter((rate) => rate?.active === true) : [];
}
