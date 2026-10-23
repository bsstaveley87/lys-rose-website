import { validateApplication, validateFields, limits } from '../../assets/validation.js';
const origins = new Set(['https://lysrosebabyspa.com','https://www.lysrosebabyspa.com','https://bsstaveley87.github.io']);
export type Signup = Record<string,string|boolean|string[]>;
export type ApplicationFile = { filename:string; contentType:string; data:string };
export type ApplicationMail = {
  fullName:string; email:string; phone:string; location:string;
  weekdayAvailability:string; weekendAvailability:string;
  resume:ApplicationFile; coverLetter:ApplicationFile | null;
};
export class ValidationError extends Error {
  fields: Record<string,string>;
  constructor(fields: Record<string,string>) { super('Please check the highlighted fields.'); this.fields=fields; }
}
export function validateSignup(raw: unknown): Signup {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ValidationError({parentName:'Please enter your name.',email:'Please enter a valid email address.'});
  const data = {...(raw as Record<string,unknown>)};
  // Cached pages can still post the removed preferred-dates field. Drop it so it is not validated, stored, or emailed.
  delete data.preferredDates;
  const errors = validateFields(data);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const result: Signup = {};
  for (const field of Object.keys(limits)) result[field] = String(data[field] || '').trim();
  result.interests = [...new Set((data.interests || []) as string[])];
  result.smsConsent = false;
  result.submittedAt = new Date().toISOString();
  return result;
}
function confirmationHtml(message: string,success: boolean): string {
  // All text is a server-authored string, never user input.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${success?'Thank you':'Please check your signup'} · Lys Rose Baby Spa</title><link rel="stylesheet" href="https://lysrosebabyspa.com/assets/site.css"></head><body><main class="not-found editorial-wrap"><h1>${success?"Thank you, you're on the list.":'Please check your signup'}</h1><p>${message}</p><a class="button" href="https://lysrosebabyspa.com/#waitlist">Return to Lys Rose Baby Spa</a><p><a href="mailto:hello@lysrosebabyspa.com">hello@lysrosebabyspa.com</a></p></main></body></html>`;
}
const applicationBytes = 11 * 1024 * 1024;
const mimeByExtension: Record<string,string> = {
  pdf:'application/pdf',
  doc:'application/msword',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
function safeFilename(name: string, fallback: string): string {
  const base = name.split(/[/\\]/).pop() || fallback;
  const clean = base.replace(/[^\w.\- ()]+/g,'').slice(0,80);
  return clean || fallback;
}
function mimeForExtension(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  return mimeByExtension[extension] || 'application/octet-stream';
}
async function fileBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) binary += String.fromCharCode(...bytes.subarray(index, index + step));
  return btoa(binary);
}
function applicationHtml(heading: string, message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${heading} · Lys Rose Baby Spa</title><link rel="stylesheet" href="https://lysrosebabyspa.com/assets/site.css"></head><body><main class="not-found editorial-wrap"><h1>${heading}</h1><p>${message}</p><a class="button" href="https://lysrosebabyspa.com/careers/#apply">Return to the application</a><p><a href="mailto:hello@lysrosebabyspa.com">hello@lysrosebabyspa.com</a></p></main></body></html>`;
}
async function handleApplication(request: Request, env: Pick<Env,'LIMITER'>, send?: (application: ApplicationMail)=>Promise<void>): Promise<Response> {
  const origin = request.headers.get('Origin') || '';
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const headers = new Headers({'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
  if (origins.has(origin)) {
    headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Content-Type, Accept');
  }
  const reply = (body: {error?:string;success?:boolean;fields?:Record<string,string>}, status=200) => {
    const responseHeaders = new Headers(headers);
    if (status===429) responseHeaders.set('Retry-After','60');
    if (status===405) responseHeaders.set('Allow','POST, OPTIONS');
    if (!wantsJson && origins.has(origin) && request.method === 'POST') {
      responseHeaders.set('Content-Type','text/html; charset=utf-8');
      const text = body.success ? 'We have your application and will be in touch.' : (body.error || 'Please check your application and try again.');
      return new Response(applicationHtml(body.success ? 'Thank you for applying.' : 'Please check your application', text), {status, headers:responseHeaders});
    }
    responseHeaders.set('Content-Type','application/json');
    return new Response(JSON.stringify(body), {status, headers:responseHeaders});
  };
  if (!origins.has(origin)) return reply({error:'Origin not allowed.'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (request.method !== 'POST') return reply({error:'Method not allowed.'},405);
  if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) return reply({error:'Please submit the application form.'},415);
  if (!send) return reply({error:'Applications are temporarily unavailable. Please email hello@lysrosebabyspa.com.'},503);
  try {
    const limit = await env.LIMITER.limit({key:request.headers.get('CF-Connecting-IP') || 'unknown'});
    if (!limit.success) return reply({error:'Please wait one minute before trying again.'},429);
  } catch { return reply({error:'Applications are temporarily unavailable. Please email hello@lysrosebabyspa.com.'},503); }
  let application: ApplicationMail;
  try {
    if (Number(request.headers.get('Content-Length')) > applicationBytes) return reply({error:'Application is too large.'},413);
    const reader = request.body?.getReader();
    if (!reader) return reply({error:'Please complete the application form.'},400);
    let size=0; const chunks: Uint8Array[]=[];
    while (true) {
      const {done,value}=await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > applicationBytes) { await reader.cancel(); return reply({error:'Application is too large.'},413); }
      chunks.push(value);
    }
    const body = new Uint8Array(size); let offset=0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const form = await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body}).formData();
    const text = (name: string) => { const value = form.get(name); return typeof value === 'string' ? value : ''; };
    const data = {fullName:text('fullName'),email:text('email'),phone:text('phone'),location:text('location'),weekdayAvailability:text('weekdayAvailability'),weekendAvailability:text('weekendAvailability'),website:text('website')};
    const resumeEntry = form.get('resume');
    const coverEntry = form.get('coverLetter');
    const resume = resumeEntry instanceof File ? resumeEntry : null;
    const cover = coverEntry instanceof File && coverEntry.name && coverEntry.size > 0 ? coverEntry : null;
    const errors = validateApplication(data,{
      resume: resume ? {name:resume.name,type:resume.type,size:resume.size} : null,
      coverLetter: cover ? {name:cover.name,type:cover.type,size:cover.size} : null,
    });
    if (Object.keys(errors).length) throw new ValidationError(errors);
    if (data.website.trim()) return reply({success:true});
    application = {
      fullName:data.fullName.trim(), email:data.email.trim(), phone:data.phone.trim(), location:data.location.trim(),
      weekdayAvailability:data.weekdayAvailability.trim(), weekendAvailability:data.weekendAvailability.trim(),
      resume:{filename:safeFilename(resume!.name,'resume.pdf'), contentType:mimeForExtension(resume!.name), data:await fileBase64(resume!)},
      coverLetter: cover ? {filename:safeFilename(cover.name,'cover-letter.pdf'), contentType:mimeForExtension(cover.name), data:await fileBase64(cover)} : null,
    };
  } catch (error) {
    return reply({error:'Please check the highlighted fields.', ...(error instanceof ValidationError ? {fields:error.fields} : {})},400);
  }
  try {
    await send(application);
    console.log(JSON.stringify({event:'application_email_accepted'}));
    return reply({success:true});
  } catch {
    console.error(JSON.stringify({event:'application_email_failed'}));
    return reply({error:'Your application could not be sent. Please try again, or email hello@lysrosebabyspa.com.'},502);
  }
}
export async function handleRequest(request: Request, env: Pick<Env,'LIMITER'>, send: (signup: Signup)=>Promise<void>, sendApplication?: (application: ApplicationMail)=>Promise<void>): Promise<Response> {
  if (new URL(request.url).pathname === '/apply') return handleApplication(request, env, sendApplication);
  const origin = request.headers.get('Origin') || '';
  const isForm = request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded') || false;
  const headers = new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
  if (origins.has(origin)) {
    headers.set('Access-Control-Allow-Origin',origin); headers.set('Access-Control-Allow-Methods','POST, OPTIONS'); headers.set('Access-Control-Allow-Headers','Content-Type');
  }
  const reply = (body: {error?:string;success?:boolean;fields?:Record<string,string>},status=200) => {
    const responseHeaders = new Headers(headers);
    if (status===429) responseHeaders.set('Retry-After','60');
    if (status===405) responseHeaders.set('Allow','POST, OPTIONS');
    if (isForm && origins.has(origin)) {
      responseHeaders.set('Content-Type','text/html; charset=utf-8');
      const text = body.success ? "We'll email you as soon as sessions open." : (body.error || 'Please check your details and try again.');
      return new Response(confirmationHtml(text,!!body.success),{status,headers:responseHeaders});
    }
    return new Response(JSON.stringify(body),{status,headers:responseHeaders});
  };
  if (new URL(request.url).pathname !== '/waitlist') return reply({error:'Not found.'},404);
  if (!origins.has(origin)) return reply({error:'Origin not allowed.'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (request.method !== 'POST') return reply({error:'Method not allowed.'},405);
  if (!isForm && !request.headers.get('Content-Type')?.startsWith('application/json')) return reply({error:'Please submit the website form.'},415);
  try {
    const limit = await env.LIMITER.limit({key:request.headers.get('CF-Connecting-IP') || 'unknown'});
    if (!limit.success) return reply({error:'Please wait one minute before trying again.'},429);
  } catch { return reply({error:'Signups are temporarily unavailable. Please email hello@lysrosebabyspa.com.'},503); }
  let signup: Signup;
  try {
    if (Number(request.headers.get('Content-Length')) > 8192) return reply({error:'Form too large.'},413);
    const reader = request.body?.getReader();
    if (!reader) return reply({error:'Please enter your name and email.'},400);
    let size=0; const chunks: Uint8Array[]=[];
    while(true) {
      const {done,value}=await reader.read(); if(done) break;
      size+=value.byteLength;
      if(size>8192) { await reader.cancel(); return reply({error:'Form too large.'},413); }
      chunks.push(value);
    }
    const body=new Uint8Array(size); let offset=0;
    for(const chunk of chunks) { body.set(chunk,offset); offset+=chunk.byteLength; }
    const text=new TextDecoder().decode(body);
    if (isForm) {
      const params=new URLSearchParams(text);
      signup=validateSignup({...Object.fromEntries(params),interests:params.getAll('interests')});
    } else signup=validateSignup(JSON.parse(text));
  } catch(error) {
    return reply({error:'Please check your name, email and optional details.',...(error instanceof ValidationError ? {fields:error.fields} : {})},400);
  }
  if (signup.website) return reply({success:true});
  try {
    await send(signup);
    console.log(JSON.stringify({event:'waitlist_email_accepted'}));
    return reply({success:true});
  } catch {
    // Provider exceptions may contain addresses, so never put their raw message in logs.
    console.error(JSON.stringify({event:'waitlist_email_failed'}));
    return reply({error:'Your signup could not be sent. Please try again, or email hello@lysrosebabyspa.com.'},502);
  }
}
