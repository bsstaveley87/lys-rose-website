import { validateFields, limits } from '../../assets/validation.js';
const origins = new Set(['https://lysrosebabyspa.com','https://www.lysrosebabyspa.com','https://bsstaveley87.github.io']);
export type Signup = Record<string,string|boolean|string[]>;
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
export async function handleRequest(request: Request, env: Pick<Env,'LIMITER'>, send: (signup: Signup)=>Promise<void>): Promise<Response> {
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
