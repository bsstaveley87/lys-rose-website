import { defineConfig, bindings } from 'cf/config';
export default defineConfig({
  accountId: 'b69bc99a43e009e66f5d9da71bcfbb5e',
  worker: {
    name: 'lys-rose-waitlist',
    entrypoint: './src/index.ts',
    compatibilityDate: '2026-10-21',
    domains: ['forms.lysrosebabyspa.com'],
    env: {
      EMAIL: bindings.sendEmail({destinationAddress:'hello@lysrosebabyspa.com'}),
      LIMITER: bindings.rateLimit({namespace:'10021',simple:{limit:3,period:60}}),
    },
    observability: {enabled:true, redactQueryString:true, traces:{enabled:true,headSamplingRate:0.1}},
  },
});
