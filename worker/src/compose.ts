import { createMimeMessage, Mailbox } from 'mimetext/browser';
import type { ApplicationFile, ApplicationMail, Signup } from './handler.ts';
export function composeSignup(signup: Signup): string {
  const message=createMimeMessage();
  message.setSender({name:'Lys Rose Website',addr:'waitlist@forms.lysrosebabyspa.com'});
  message.setRecipient('hello@lysrosebabyspa.com');
  message.setHeader('Reply-To',new Mailbox(String(signup.email)));
  message.setSubject('New Lys Rose waitlist signup');
  message.setHeader('Message-ID',`<${crypto.randomUUID()}@forms.lysrosebabyspa.com>`);
  const text=Object.entries(signup).filter(([key])=>key!=='website'&&key!=='preferredDates').map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(', '):value}`).join('\n');
  const html='<pre>'+text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))+'</pre>';
  message.addMessage({contentType:'text/plain',encoding:'base64',data:message.toBase64(text)});
  message.addMessage({contentType:'text/html',encoding:'base64',data:message.toBase64(html)});
  return message.asRaw();
}
export function composeApplication(application: ApplicationMail): string {
  const message=createMimeMessage();
  message.setSender({name:'Lys Rose Website',addr:'waitlist@forms.lysrosebabyspa.com'});
  message.setRecipient('hello@lysrosebabyspa.com');
  message.setHeader('Reply-To',new Mailbox(application.email));
  message.setSubject(`New Production Assistant application: ${application.fullName}`);
  message.setHeader('Message-ID',`<${crypto.randomUUID()}@forms.lysrosebabyspa.com>`);
  const text=[
    `Name: ${application.fullName}`,
    `Email: ${application.email}`,
    `Phone: ${application.phone}`,
    `Based in: ${application.location}`,
    `Weekday availability: ${application.weekdayAvailability}`,
    `Weekend availability: ${application.weekendAvailability}`,
  ].join('\n');
  const html='<pre>'+text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))+'</pre>';
  message.addMessage({contentType:'text/plain',encoding:'base64',data:message.toBase64(text)});
  message.addMessage({contentType:'text/html',encoding:'base64',data:message.toBase64(html)});
  const attach=(file: ApplicationFile)=>message.addAttachment({filename:file.filename,contentType:file.contentType,encoding:'base64',data:file.data});
  attach(application.resume);
  if (application.coverLetter) attach(application.coverLetter);
  return message.asRaw();
}
