/** Rules shared by the browser and Cloudflare so optional fields behave consistently. */
export const ages = ['', 'Expecting', '0–3 months', '3–6 months', '6–9 months', '9–12 months'];
export const areas = ['', 'Fort Lauderdale', 'Elsewhere in Broward', 'Boca Raton', 'North Miami', 'Somewhere else nearby'];
export const interestOptions = ['Milk bath', 'Infant massage', 'Guided baby face care', 'The full new parent experience', 'Other'];
export const limits = { parentName:100, email:254, babyName:100, babyAge:30, area:60, zip:10, phone:30, referral:200, website:200 };
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
export const applicationLimits = { fullName:100, email:254, phone:30, location:120, weekdayAvailability:200, weekendAvailability:200, website:200 };
export const applicationFileBytes = 5 * 1024 * 1024;
const applicationExtensions = new Set(['pdf','doc','docx']);
const applicationMimeTypes = new Set(['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream','']);
/** @param {{name?: string, type?: string, size?: number} | null | undefined} file @param {boolean} required */
export function applicationFileError(file, required) {
  const name = typeof file?.name === 'string' ? file.name.trim() : '';
  const size = Number(file?.size || 0);
  const type = typeof file?.type === 'string' ? file.type.toLowerCase() : '';
  if (!name || size <= 0) return required ? 'Please upload a PDF, DOC, or DOCX file.' : '';
  const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  if (!applicationExtensions.has(extension) || !applicationMimeTypes.has(type)) return 'Please upload a PDF, DOC, or DOCX file.';
  if (size > applicationFileBytes) return 'Please keep each file to 5 MB or smaller.';
  return '';
}
/** @param {Record<string, unknown>} data @param {{resume?: {name?: string, type?: string, size?: number} | null, coverLetter?: {name?: string, type?: string, size?: number} | null}} [files] @returns {Record<string, string>} */
export function validateApplication(data, files = {}) {
  const errors = {};
  /** @type {Record<string, string>} */
  const values = {};
  for (const [field,max] of Object.entries(applicationLimits)) {
    const raw = data[field];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') { errors[field] = 'Please enter a valid value.'; continue; }
    const value = String(raw || '').trim();
    values[field] = value;
    if (value.length > max || /[\x00-\x1f\x7f]/.test(value)) errors[field] = `Please use ${max} characters or fewer, without line breaks.`;
  }
  if (!errors.fullName && (!values.fullName || !/\p{L}/u.test(values.fullName))) errors.fullName = 'Please enter your name.';
  if (!errors.email && (!values.email || !emailPattern.test(values.email) || values.email.split('@')[0].length > 64)) errors.email = 'Please enter a valid email address, such as you@example.com.';
  if (!errors.phone && !values.phone) errors.phone = 'Please enter a phone number.';
  else if (!errors.phone && (!/^\+?[\d ().-]+$/.test(values.phone) || values.phone.replace(/\D/g,'').length < 7 || values.phone.replace(/\D/g,'').length > 15)) errors.phone = 'Enter a phone number with 7–15 digits; spaces, +, ( ), dots and dashes are allowed.';
  if (!errors.location && !values.location) errors.location = 'Please tell us which part of greater Fort Lauderdale you are based in.';
  if (!errors.weekdayAvailability && !values.weekdayAvailability) errors.weekdayAvailability = 'Please tell us your weekday availability.';
  if (!errors.weekendAvailability && !values.weekendAvailability) errors.weekendAvailability = 'Please tell us your weekend availability.';
  const resumeError = applicationFileError(files.resume, true);
  if (resumeError) errors.resume = resumeError;
  const coverError = applicationFileError(files.coverLetter, false);
  if (coverError) errors.coverLetter = coverError;
  return errors;
}
