/**
 * The model layer (OpenAI) — settings-driven, with a cheap intent router, a
 * tool-calling loop, and TOKEN-BY-TOKEN streaming for the chat widget.
 *
 * The OpenAI key, models, temperature, and persona come from the `settings`
 * table (admin-controllable) via getEffectiveConfig(); knowledge comes from the
 * DB too. Swap providers by changing only this file.
 */
import OpenAI from 'openai';
import { CONFIG } from './config.js';
import { AGENTS, DEFAULT_AGENT, agentMenu } from './agents.js';
import { knowledgeFor } from './knowledge.js';
import { COMPLIANCE, STYLE } from './compliance.js';
import { toolsFor, runTool } from './tools.js';
import { getEffectiveConfig } from './settings.js';

let _client = null;
let _clientKey = null;

/** Get (or rebuild) the OpenAI client for the current API key. */
function clientFor(apiKey) {
  if (!_client || _clientKey !== apiKey) {
    _client = new OpenAI({ apiKey: apiKey || 'missing-key' });
    _clientKey = apiKey;
  }
  return _client;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join(' ');
  return '';
}

/** Classify the conversation into exactly one specialist agent. */
export async function routeAgent(messages) {
  const keys = Object.keys(AGENTS);
  const eff = await getEffectiveConfig();
  const client = clientFor(eff.apiKey);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = textOf(lastUser?.content).slice(0, 2000) || 'general question';

  try {
    const resp = await client.chat.completions.create({
      model: eff.routerModel,
      temperature: 0,
      max_tokens: 12,
      messages: [
        { role: 'system', content: `Classify the user's message into exactly ONE XB2BX agent.\n${agentMenu()}\n\nReply with ONLY the agent key. Nothing else.` },
        { role: 'user', content: text }
      ]
    });
    const out = (resp.choices[0]?.message?.content || '').trim().toLowerCase();
    return keys.find((k) => out.includes(k)) || DEFAULT_AGENT;
  } catch (err) {
    console.error('[router] fallback:', err?.message || err);
    return DEFAULT_AGENT;
  }
}

/** Build the full system prompt: knowledge + role + style + compliance + persona. */
async function systemPrompt(agent, eff) {
  const knowledge = await knowledgeFor(agent.knowledge);
  const parts = [
    knowledge,
    `# YOUR ROLE\n\nYou are the **${agent.label}** for XB2BX.\n\n${agent.instructions}`,
    STYLE,
    COMPLIANCE
  ];
  if (eff.personaExtra) parts.push(`# EXTRA INSTRUCTIONS\n\n${eff.personaExtra}`);
  if (eff.contact?.email || eff.contact?.phone || eff.contact?.hours) {
    parts.push(
      `# CONTACT DETAILS (share when a human handoff is relevant)\n` +
        [eff.contact.email && `Email: ${eff.contact.email}`, eff.contact.phone && `Phone: ${eff.contact.phone}`, eff.contact.hours && `Hours: ${eff.contact.hours}`]
          .filter(Boolean)
          .join('\n')
    );
  }
  return parts.join('\n\n---\n\n');
}

function toOpenAIMessages(messages) {
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-14)
    .map((m) => ({ role: m.role, content: textOf(m.content) }));
}

/**
 * Core loop. If onToken is provided, the FINAL answer is streamed token-by-token
 * through it. Returns { reply, agent, actions }.
 */
async function run(messages, agentKey, onToken) {
  const agent = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];
  const eff = await getEffectiveConfig();
  const client = clientFor(eff.apiKey);

  const convo = [{ role: 'system', content: await systemPrompt(agent, eff) }, ...toOpenAIMessages(messages)];
  const tools = toolsFor(agent.tools);
  const actionsTaken = [];

  for (let hop = 0; hop < CONFIG.maxToolHops; hop++) {
    const stream = await client.chat.completions.create({
      model: eff.mainModel,
      temperature: eff.temperature,
      max_tokens: eff.maxTokens,
      messages: convo,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? 'auto' : undefined,
      stream: true
    });

    let content = '';
    const toolCalls = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        if (onToken) onToken(delta.content); // tokens only appear on the final answer
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const i = tc.index;
          if (!toolCalls[i]) toolCalls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } };
          if (tc.id) toolCalls[i].id = tc.id;
          if (tc.function?.name) toolCalls[i].function.name += tc.function.name;
          if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments;
        }
      }
    }

    if (toolCalls.length) {
      convo.push({ role: 'assistant', content: content || null, tool_calls: toolCalls });
      for (const call of toolCalls) {
        let args = {};
        try {
          args = JSON.parse(call.function.arguments || '{}');
        } catch {
          args = {};
        }
        actionsTaken.push({ tool: call.function.name, input: args });
        const result = await runTool(call.function.name, args);
        convo.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
      continue; // model will now use the tool results
    }

    return {
      reply: content.trim() || "I'm here to help — could you tell me a little more about what you need?",
      agent: agent.label,
      actions: actionsTaken
    };
  }

  return { reply: "I've gathered what I can. Let me connect you with the XB2BX team to take this further. ✅", agent: agent.label, actions: actionsTaken };
}

/** Non-streaming reply (used by /api/chat and admin test). */
export async function reply(messages, agentKey) {
  return run(messages, agentKey, null);
}

/** Streaming reply — onToken(textChunk) fires for each token of the final answer. */
export async function replyStream(messages, agentKey, onToken) {
  return run(messages, agentKey, onToken);
}
