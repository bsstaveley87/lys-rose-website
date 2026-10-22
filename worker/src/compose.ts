import { createMimeMessage, Mailbox } from 'mimetext/browser';
import type { Signup } from './handler.ts';
export function composeSignup(signup: Signup): string {
  const message=createMimeMessage();
  message.setSender({name:'Lys Rose Website',addr:'waitlist@forms.lysrosebabyspa.com'});
  message.setRecipient('hello@lysrosebabyspa.com');
  message.setHeader('Reply-To',new Mailbox(String(signup.email)));
  message.setSubject('New Lys Rose waitlist signup');
  message.setHeader('Message-ID',`<${crypto.randomUUID()}@forms.lysrosebabyspa.com>`);
  const text=Object.entries(signup).filter(([key])=>key!=='website').map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(', '):value}`).join('\n');
  const html='<pre>'+text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))+'</pre>';
  message.addMessage({contentType:'text/plain',encoding:'base64',data:message.toBase64(text)});
  message.addMessage({contentType:'text/html',encoding:'base64',data:message.toBase64(html)});
  return message.asRaw();
}
