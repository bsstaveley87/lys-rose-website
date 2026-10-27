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

test('silently ignores preferredDates from an old cached form',async()=>{
  for(const preferredDates of ['Saturday mornings','x'.repeat(500)+'\nnext week',['Saturday'],12,{when:'Saturday'}]){
    const signup=validateSignup({...valid,preferredDates});
    assert.equal(Object.hasOwn(signup,'preferredDates'),false);
  }
  let sent;
  const response=await handleRequest(request({...valid,preferredDates:'Saturday mornings\n'+'x'.repeat(400)}),env,async signup=>{sent=signup;});
  assert.equal(response.status,200);
  assert.equal(Object.hasOwn(sent,'preferredDates'),false);
  assert.deepEqual(await response.json(),{success:true});
  const form=await handleRequest(new Request('https://forms.lysrosebabyspa.com/waitlist',{method:'POST',headers:{Origin:'https://lysrosebabyspa.com','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({parentName:'Ben',email:'hello@lysrosebabyspa.com',preferredDates:'next month'})}),env,async signup=>{assert.equal(Object.hasOwn(signup,'preferredDates'),false);});
  assert.equal(form.status,200);
  const {composeSignup}=await import('../worker/src/compose.ts');
  const raw=composeSignup({...validateSignup(valid),preferredDates:'Saturday mornings'});
  for(const part of raw.matchAll(/Content-Transfer-Encoding: base64\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/g)){
    const text=Buffer.from(part[1].replace(/\s/g,''),'base64').toString('utf8');
    assert.equal(text.includes('preferredDates'),false);
    assert.equal(text.includes('Saturday mornings'),false);
  }
});
test('accepts the new interests and lists them in the signup email',async()=>{
  const interests=['Milk bath','Guided baby face care','The full new parent experience','Other'];
  const signup=validateSignup({...valid,interests});
  assert.deepEqual(signup.interests,interests);
  let sent;
  const response=await handleRequest(request({...valid,interests:['Guided baby face care']}),env,async value=>{sent=value;});
  assert.equal(response.status,200);
  assert.deepEqual(sent.interests,['Guided baby face care']);
  const {composeSignup}=await import('../worker/src/compose.ts');
  const raw=composeSignup(signup);
  const text=[...raw.matchAll(/Content-Transfer-Encoding: base64\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/g)].map(part=>Buffer.from(part[1].replace(/\s/g,''),'base64').toString('utf8')).join('\n');
  assert.ok(text.includes('interests: Milk bath, Guided baby face care, The full new parent experience, Other'));
  assert.equal(text.toLowerCase().includes('facial'),false);
});
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
const applicationForm=()=>{
  const form=new FormData();
  form.set('fullName','Ada Lopez');
  form.set('email','ada@example.com');
  form.set('phone','954-555-0100');
  form.set('location','Victoria Park');
  form.set('weekdayAvailability','Tuesday mornings');
  form.set('weekendAvailability','Saturday afternoon');
  form.set('resume',new File(['%PDF-1.4'],'resume.pdf',{type:'application/pdf'}));
  return form;
};
const applicationRequest=(form,accept='application/json')=>new Request('https://forms.lysrosebabyspa.com/apply',{method:'POST',headers:{Origin:'https://lysrosebabyspa.com',Accept:accept},body:form});
test('emails a production assistant application with the resume attached',async()=>{
  let sent;
  const response=await handleRequest(applicationRequest(applicationForm()),env,async()=>assert.fail(),async application=>{sent=application;});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{success:true});
  assert.equal(sent.fullName,'Ada Lopez');
  assert.equal(sent.resume.filename,'resume.pdf');
  assert.equal(sent.resume.contentType,'application/pdf');
  assert.equal(sent.coverLetter,null);
  const {composeApplication}=await import('../worker/src/compose.ts');
  const raw=composeApplication(sent);
  const encoded=raw.match(/Subject: =\?utf-8\?B\?([^?]+)\?=/)[1];
  assert.equal(Buffer.from(encoded,'base64').toString('utf8'),'New Production Assistant application: Ada Lopez');
  assert.match(raw,/filename="resume.pdf"/);
  assert.ok(raw.includes(Buffer.from('Name: Ada Lopez\nEmail: ada@example.com').toString('base64').slice(0,24)));
  assert.equal(raw.includes('website:'),false);
});
test('attaches an optional cover letter and does not email a honeypot application',async()=>{
  const form=applicationForm();
  form.set('coverLetter',new File(['cover'],'letter.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
  let sent;
  const response=await handleRequest(applicationRequest(form),env,async()=>assert.fail(),async application=>{sent=application;});
  assert.equal(response.status,200);
  assert.equal(sent.coverLetter.filename,'letter.docx');
  assert.equal(sent.coverLetter.contentType,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const spam=applicationForm();
  spam.set('website','bot');
  const quiet=await handleRequest(applicationRequest(spam),env,async()=>assert.fail(),async()=>assert.fail());
  assert.equal(quiet.status,200);
  const html=await handleRequest(applicationRequest(applicationForm(),'text/html'),env,async()=>{},async()=>{});
  assert.match(html.headers.get('Content-Type'),/text\/html/);
  assert.match(await html.text(),/Thank you for applying/);
});
test('rejects an application file that is missing, the wrong type, or larger than 5 MB',async()=>{
  const missing=applicationForm();
  missing.delete('resume');
  const missingResponse=await handleRequest(applicationRequest(missing),env,async()=>assert.fail(),async()=>assert.fail());
  assert.equal(missingResponse.status,400);
  assert.ok((await missingResponse.json()).fields.resume);
  const png=applicationForm();
  png.set('resume',new File(['not a resume'],'photo.png',{type:'image/png'}));
  const pngResponse=await handleRequest(applicationRequest(png),env,async()=>assert.fail(),async()=>assert.fail());
  assert.equal(pngResponse.status,400);
  const huge=applicationForm();
  huge.set('resume',new File([new Uint8Array(5*1024*1024+1)],'resume.pdf',{type:'application/pdf'}));
  const hugeResponse=await handleRequest(applicationRequest(huge),env,async()=>assert.fail(),async()=>assert.fail());
  assert.equal(hugeResponse.status,400);
  assert.match((await hugeResponse.json()).fields.resume,/5 MB/);
  const injected=applicationForm();
  injected.set('fullName','Ada\nBcc: spam@example.com');
  const injectedResponse=await handleRequest(applicationRequest(injected),env,async()=>assert.fail(),async()=>assert.fail());
  assert.equal(injectedResponse.status,400);
});
