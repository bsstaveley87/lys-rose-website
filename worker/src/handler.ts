const origins = new Set(['https://lysrosebabyspa.com','https://www.lysrosebabyspa.com','https://bsstaveley87.github.io']);
const ages = ['','Expecting','0–3 months','3–6 months','6–9 months','9–12 months'];
const areas = ['','Fort Lauderdale','Elsewhere in Broward','Boca Raton','North Miami','Somewhere else nearby'];
const interestOptions = ['Milk bath','Infant massage','Mini photoshoot','Other'];
export type Signup = Record<string,string|boolean|string[]>;
export function validateSignup(raw: unknown): Signup {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid form.');
  const data = raw as Record<string,unknown>;
  const result: Signup = {};
  for (const field of ['parentName','email','babyAge','babyName','area','zip','preferredDates','phone','referral','website']) {
    if (data[field] !== undefined && typeof data[field] !== 'string') throw new Error('Invalid field.');
    const value = String(data[field] || '').trim();
    if (value.length > (field === 'email' ? 254 : 200) || /[\r\n\x00-\x1f]/.test(value)) throw new Error('Invalid field.');
    result[field] = value;
  }
  if (!result.parentName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(result.email))) throw new Error('Please enter your name and email.');
  if (!ages.includes(String(result.babyAge)) || !areas.includes(String(result.area))) throw new Error('Invalid selection.');
  if (!Array.isArray(data.interests) || data.interests.length>4 || data.interests.some(x=>!interestOptions.includes(x))) throw new Error('Invalid interests.');
  result.interests = [...new Set(data.interests)] as string[];
  result.smsConsent = false;
  result.submittedAt = new Date().toISOString();
  return result;
}
export async function handleRequest(request: Request, env: Pick<Env,'LIMITER'>, send: (signup: Signup)=>Promise<void>): Promise<Response> {
  const origin = request.headers.get('Origin') || '';
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://lysrosebabyspa.com','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff'};
  const reply = (body: object,status=200) => new Response(JSON.stringify(body),{status,headers});
  if (new URL(request.url).pathname !== '/waitlist') return reply({error:'Not found.'},404);
  if (!origins.has(origin)) return reply({error:'Origin not allowed.'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (request.method !== 'POST') return reply({error:'Method not allowed.'},405);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({error:'JSON required.'},415);
  const limit = await env.LIMITER.limit({key:request.headers.get('CF-Connecting-IP') || 'unknown'});
  if (!limit.success) return reply({error:'Please wait a minute before trying again.'},429);
  let signup: Signup;
  try {
    // Enforce the limit while reading, including requests without Content-Length.
    if (Number(request.headers.get('Content-Length')) > 8192) return reply({error:'Form too large.'},413);
    const reader = request.body?.getReader();
    if (!reader) return reply({error:'Form required.'},400);
    let size=0; const chunks: Uint8Array[]=[];
    while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>8192){await reader.cancel();return reply({error:'Form too large.'},413);} chunks.push(value); }
    const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
    signup=validateSignup(JSON.parse(new TextDecoder().decode(body)));
  } catch { return reply({error:'Please check your name, email and selections.'},400); }
  if (signup.website) return reply({success:true});
  try {
    await send(signup);
    console.log(JSON.stringify({event:'waitlist_email_accepted'}));
    return reply({success:true});
  } catch(error) {
    console.error(JSON.stringify({event:'waitlist_email_failed',message:error instanceof Error?error.message.replace(/[^\s@]+@[^\s@]+/g,'[email]'):'Unknown error'}));
    return reply({error:'Your signup could not be sent. Please try again, or email hello@lysrosebabyspa.com.'},502);
  }
}
