import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest,validateSignup} from '../worker/src/handler.ts';
const valid={parentName:'Test parent',email:'hello@lysrosebabyspa.com',interests:['Milk bath'],babyAge:'Expecting'};
const env={LIMITER:{limit:async()=>({success:true})}};
const request=(data=valid,origin='https://lysrosebabyspa.com',method='POST')=>new Request('https://forms.lysrosebabyspa.com/waitlist',{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(data)}:{})});
test('accepts signup and records email-only consent and timestamp',()=>{const s=validateSignup(valid);assert.equal(s.smsConsent,false);assert.ok(Date.parse(s.submittedAt));assert.equal(s.babyAge,'Expecting');});
test('rejects invalid email, header injection, selections and fields',()=>{for(const patch of [{email:'invalid'},{email:'x@y.com\r\nBcc: x@y.com'},{babyAge:'6–12 months'},{interests:['invalid']},{parentName:['name']}])assert.throws(()=>validateSignup({...valid,...patch}));});
test('returns success only after email acceptance',async()=>{let sent=false;const response=await handleRequest(request(),env,async s=>{assert.equal(s.email,valid.email);sent=true;});assert.equal(response.status,200);assert.equal(sent,true);assert.deepEqual(await response.json(),{success:true});});
test('does not report success when email fails',async()=>{const r=await handleRequest(request(),env,async()=>{throw Error('SMTP unavailable');});assert.equal(r.status,502);});
test('rejects disallowed origins without sending',async()=>{const r=await handleRequest(request(valid,'https://spam.example'),env,async()=>assert.fail());assert.equal(r.status,403);});
test('limits submissions and rejects oversized payload',async()=>{assert.equal((await handleRequest(request(),{LIMITER:{limit:async()=>({success:false})}},async()=>assert.fail())).status,429);assert.equal((await handleRequest(request({...valid,parentName:'x'.repeat(9000)}),env,async()=>assert.fail())).status,413);});
test('honeypot does not send',async()=>{assert.equal((await handleRequest(request({...valid,website:'spam'}),env,async()=>assert.fail())).status,200);});
test('CORS preflight and methods',async()=>{assert.equal((await handleRequest(request(valid,undefined,'OPTIONS'),env,async()=>assert.fail())).status,204);assert.equal((await handleRequest(request(valid,undefined,'GET'),env,async()=>assert.fail())).status,405);});

test('composes actual MIME email including Reply-To and Unicode fields',async()=>{
  const {composeSignup}=await import('../worker/src/compose.ts');
  const raw=composeSignup(validateSignup({...valid,parentName:'Élodie',babyAge:'0–3 months'}));
  assert.match(raw,/Reply-To: <hello@lysrosebabyspa.com>/);
  assert.match(raw,/Message-ID: <[a-f0-9-]+@forms.lysrosebabyspa.com>/);
  assert.match(raw,/Content-Transfer-Encoding: base64/);
  assert.ok(raw.includes(Buffer.from('parentName: Élodie\nemail: hello@lysrosebabyspa.com').toString('base64').slice(0,28)));
});

test('server reports field-specific optional detail errors',async()=>{
  const r=await handleRequest(request({...valid,zip:'bad',phone:'123'}),env,async()=>assert.fail());
  assert.equal(r.status,400);const body=await r.json();assert.ok(body.fields.zip);assert.ok(body.fields.phone);
});
test('server accepts native non-JavaScript form submission and returns an HTML confirmation',async()=>{
  const r=await handleRequest(new Request('https://forms.lysrosebabyspa.com/waitlist',{method:'POST',headers:{Origin:'https://lysrosebabyspa.com','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({parentName:'Ben',email:'hello@lysrosebabyspa.com'})}),env,async()=>{});
  assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/text\/html/);assert.match(await r.text(),/Thank you, you're on the list/);
});
test('rate limit advertises retry delay; unavailable limiter fails safely',async()=>{
  const limited=await handleRequest(request(),{LIMITER:{limit:async()=>({success:false})}},async()=>assert.fail());
  assert.equal(limited.headers.get('Retry-After'),'60');
  const unavailable=await handleRequest(request(),{LIMITER:{limit:async()=>{throw Error('offline');}}},async()=>assert.fail());assert.equal(unavailable.status,503);
});
test('untrusted origins receive no CORS authorization',async()=>{
  const r=await handleRequest(request(valid,'https://spam.example'),env,async()=>assert.fail());assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
});
