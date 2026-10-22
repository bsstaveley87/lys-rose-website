/** Rules shared by the browser and Cloudflare so optional fields behave consistently. */
export const ages = ['', 'Expecting', '0–3 months', '3–6 months', '6–9 months', '9–12 months'];
export const areas = ['', 'Fort Lauderdale', 'Elsewhere in Broward', 'Boca Raton', 'North Miami', 'Somewhere else nearby'];
export const interestOptions = ['Milk bath', 'Infant massage', 'Other'];
export const limits = { parentName:100, email:254, babyName:100, babyAge:30, area:60, zip:10, preferredDates:200, phone:30, referral:200, website:200 };
const emailPattern = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/i;
/** @param {Record<string, unknown>} data @returns {Record<string, string>} */
export function validateFields(data) {
  const errors = {};
  for (const [field,max] of Object.entries(limits)) {
    const raw = data[field];
    if (raw !== undefined && typeof raw !== 'string') { errors[field] = 'Please enter a valid value.'; continue; }
    const value = String(raw || '').trim();
    if (value.length > max || /[\x00-\x1f\x7f]/.test(value)) errors[field] = `Please use ${max} characters or fewer, without line breaks.`;
  }
  const name = typeof data.parentName === 'string' ? data.parentName.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  if (!name || !/\p{L}/u.test(name)) errors.parentName = 'Please enter your name.';
  if (!email || !emailPattern.test(email) || email.split('@')[0].length > 64) errors.email = 'Please enter a valid email address, such as you@example.com.';
  const zip = typeof data.zip === 'string' ? data.zip.trim() : '';
  if (zip && !/^\d{5}(?:-\d{4})?$/.test(zip)) errors.zip = 'Enter a 5-digit ZIP code, or ZIP+4 (for example, 33301-1234).';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) errors.phone = 'Enter a phone number with 7–15 digits; spaces, +, ( ), dots and dashes are allowed.';
  if (data.babyAge !== undefined && !ages.includes(String(data.babyAge))) errors.babyAge = 'Please select one of the listed age groups.';
  if (data.area !== undefined && !areas.includes(String(data.area))) errors.area = 'Please select one of the listed areas.';
  if (data.interests !== undefined && (!Array.isArray(data.interests) || data.interests.length > interestOptions.length || data.interests.some(value => !interestOptions.includes(value)))) errors.interests = 'Please choose from the listed interests.';
  return errors;
}
