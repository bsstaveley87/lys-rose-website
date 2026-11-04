import { EmailMessage } from 'cloudflare:email';
import { handleRequest } from './handler.ts';
import { composeSignup } from './compose.ts';
import { routeCheckout } from './checkout.ts';
export default {
  async fetch(request: Request, env: Env) {
    const checkout = await routeCheckout(request, env);
    if (checkout) return checkout;
    return handleRequest(request, env, async signup => {
      await env.EMAIL.send(new EmailMessage('waitlist@forms.lysrosebabyspa.com', 'hello@lysrosebabyspa.com', composeSignup(signup)));
    });
  },
} satisfies ExportedHandler<Env>;
