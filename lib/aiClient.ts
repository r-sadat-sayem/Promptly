import Anthropic from '@anthropic-ai/sdk';

export const ai = new Anthropic({
  baseURL: 'https://api.ai.public.rakuten-it.com/anthropic/',
  authToken: process.env.RAKUTEN_AI_GATEWAY_KEY,
});
