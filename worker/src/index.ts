import { EmailMessage } from 'cloudflare:email';
import { handleRequest } from './handler.ts';
import { composeApplication, composeSignup } from './compose.ts';
export default {
  async fetch(request: Request,env: Env) {
    return handleRequest(request,env,async signup=>{
      await env.EMAIL.send(new EmailMessage('waitlist@forms.lysrosebabyspa.com','hello@lysrosebabyspa.com',composeSignup(signup)));
    },async application=>{
      await env.EMAIL.send(new EmailMessage('waitlist@forms.lysrosebabyspa.com','hello@lysrosebabyspa.com',composeApplication(application)));
    });
  },
} satisfies ExportedHandler<Env>;
