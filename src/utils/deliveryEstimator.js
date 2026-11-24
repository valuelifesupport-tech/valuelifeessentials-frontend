/**
 * Delivery Speed & Transit Time Estimator
 * Origin Warehouse: ValueLife Essentials, Bowenpally, Hyderabad, Telangana - 500011
 */

export const WAREHOUSE_ORIGIN = {
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500011',
  name: 'ValueLife Central Hub, Hyderabad (500011)'
};

/**
 * Calculates estimated delivery speed from Hyderabad (500011) to any Indian PIN Code
 */
export function estimateDeliveryFromHyderabad(pincode, stateName = '') {
  if (!pincode) {
    return {
      minDays: 2,
      maxDays: 4,
      speedText: '2-4 business days',
      formattedDate: getFutureDeliveryDate(3),
      origin: WAREHOUSE_ORIGIN.name,
      badge: 'All-India Express'
    };
  }

  const cleanPin = String(pincode).trim().replace(/\D/g, '');
  const prefix2 = cleanPin.slice(0, 2);
  const prefix3 = cleanPin.slice(0, 3);
  const st = (stateName || '').trim().toLowerCase();

  let minDays = 3;
  let maxDays = 4;
  let badge = 'Express Shipping';

  // 1. Local Hyderabad & Telangana (500xxx - 509xxx) -> Next Day / 1-2 Days
  if (prefix2 === '50' || st.includes('telangana')) {
    minDays = 1;
    maxDays = 2;
    badge = 'Local Superfast Express';
  }
  // 2. Neighboring South India: Andhra Pradesh (515-535), Karnataka (56-59), Maharashtra (40-44), Tamil Nadu (60-64)
  else if (
    ['51', '52', '53'].includes(prefix2) || 
    st.includes('andhra') ||
    ['56', '57', '58', '59'].includes(prefix2) || 
    st.includes('karnataka') ||
    ['40', '41', '42', '43', '44'].includes(prefix2) || 
    st.includes('maharashtra') ||
    ['60', '61', '62', '63', '64'].includes(prefix2) || 
    st.includes('tamil nadu')
  ) {
    minDays = 2;
    maxDays = 3;
    badge = 'Inter-State Priority';
  }
  // 3. Central & West India: Madhya Pradesh (45-49), Gujarat (36-39), Goa (403), Kerala (67-69)
  else if (
    ['45', '46', '47', '48', '49'].includes(prefix2) || 
    st.includes('madhya') || 
    st.includes('chhattisgarh') ||
    ['36', '37', '38', '39'].includes(prefix2) || 
    st.includes('gujarat') ||
    ['67', '68', '69'].includes(prefix2) || 
    st.includes('kerala') ||
    st.includes('goa')
  ) {
    minDays = 2;
    maxDays = 3;
    badge = 'Express Direct Air/Surface';
  }
  // 4. North & East India: Delhi NCR (11), Haryana (12-13), Punjab (14-16), Rajasthan (30-34), UP (20-28), WB (70-74), Bihar (80-85)
  else if (
    prefix2 === '11' || 
    ['12', '13', '14', '15', '16'].includes(prefix2) ||
    ['30', '31', '32', '33', '34'].includes(prefix2) ||
    ['20', '21', '22', '23', '24', '25', '26', '27', '28'].includes(prefix2) ||
    ['70', '71', '72', '73', '74'].includes(prefix2) ||
    ['80', '81', '82', '83', '84', '85'].includes(prefix2) ||
    st.includes('delhi') || st.includes('rajasthan') || st.includes('uttar') || st.includes('bengal')
  ) {
    minDays = 3;
    maxDays = 4;
    badge = 'National Express';
  }
  // 5. Remote / Northeast / Hills (Himachal, J&K, Assam, etc.)
  else {
    minDays = 4;
    maxDays = 5;
    badge = 'Standard Air Express';
  }

  const speedText = minDays === maxDays ? `${minDays} business days` : `${minDays}-${maxDays} business days`;
  const formattedDate = getFutureDeliveryDate(maxDays);

  return {
    minDays,
    maxDays,
    speedText,
    formattedDate,
    origin: WAREHOUSE_ORIGIN.name,
    originCity: 'Hyderabad (500011)',
    badge
  };
}

/**
 * Calculates human readable delivery target date skipping Sundays
 */
export function getFutureDeliveryDate(daysToAdd = 3) {
  const d = new Date();
  let added = 0;
  while (added < daysToAdd) {
    d.setDate(d.getDate() + 1);
    // Skip Sunday (0)
    if (d.getDay() !== 0) {
      added++;
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
}

/**
 * Live async serviceability check via Shiprocket API with 500011 pickup origin fallback
 */
export async function checkLiveServiceability(deliveryPincode) {
  const cleanPin = String(deliveryPincode || '').trim().replace(/\D/g, '');
  if (cleanPin.length !== 6) return null;

  // Quick fallback calculation
  const fallback = estimateDeliveryFromHyderabad(cleanPin);

  try {
    const res = await fetch('/api/shipping/shiprocket/check-serviceability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delivery_pincode: cleanPin,
        pickup_pincode: '500011'
      })
    });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.couriers) && data.couriers.length > 0) {
      const best = data.couriers[0];
      const days = Number(best.estimated_delivery_days || fallback.maxDays);
      return {
        serviceable: true,
        courierName: best.name,
        speedText: best.etd ? `Estimated: ${best.etd}` : `${days} business days`,
        formattedDate: getFutureDeliveryDate(days),
        minDays: Math.max(1, days - 1),
        maxDays: days,
        origin: WAREHOUSE_ORIGIN.name,
        originCity: 'Hyderabad (500011)',
        badge: best.name ? `via ${best.name}` : fallback.badge
      };
    }
  } catch (_) {}

  return {
    serviceable: true,
    ...fallback
  };
}
