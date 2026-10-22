import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import { handleRequest } from './handler.ts';
export default {
  async fetch(request: Request,env: Env) {
    return handleRequest(request,env,async signup=>{
      const message=createMimeMessage();
      message.setSender({name:'Lys Rose Website',addr:'waitlist@forms.lysrosebabyspa.com'});
      message.setRecipient('hello@lysrosebabyspa.com');
      message.setHeader('Reply-To',String(signup.email));
      message.setSubject('New Lys Rose waitlist signup');
      const text = Object.entries(signup).filter(([key])=>key!=='website').map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(', '):value}`).join('\n');
      message.addMessage({contentType:'text/plain',data:text});
      message.addMessage({contentType:'text/html',data:'<pre>'+text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))+'</pre>'});
      await env.EMAIL.send(new EmailMessage('waitlist@forms.lysrosebabyspa.com','hello@lysrosebabyspa.com',message.asRaw()));
    });
  },
} satisfies ExportedHandler<Env>;
