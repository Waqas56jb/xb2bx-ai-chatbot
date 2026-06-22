/**
 * The model layer (OpenAI) — one shared client, a cheap intent router, and the
 * main reply loop that handles tool calls.
 *
 * Uses OpenAI Chat Completions with function/tool calling. Swap the provider by
 * changing only this file; agents, knowledge, tools, and the server are agnostic.
 */
import OpenAI from 'openai';
import { CONFIG } from './config.js';
import { AGENTS, DEFAULT_AGENT, agentMenu } from './agents.js';
import { knowledgeFor } from './knowledge.js';
import { COMPLIANCE, STYLE } from './compliance.js';
import { toolsFor, runTool } from './tools.js';

const client = new OpenAI({ apiKey: CONFIG.openaiApiKey });

/** Plain text of a message's content (handles string or array content). */
function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join(' ');
  }
  return '';
}

/** Classify the conversation into exactly one specialist agent (fast + cheap). */
export async function routeAgent(messages) {
  const keys = Object.keys(AGENTS);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = textOf(lastUser?.content).slice(0, 2000) || 'general question';

  try {
    const resp = await client.chat.completions.create({
      model: CONFIG.routerModel,
      temperature: 0,
      max_tokens: 12,
      messages: [
        {
          role: 'system',
          content:
            `Classify the user's message into exactly ONE XB2BX agent.\n` +
            `${agentMenu()}\n\n` +
            `Reply with ONLY the agent key (e.g. "trade_advisor"). Nothing else.`
        },
        { role: 'user', content: text }
      ]
    });
    const out = (resp.choices[0]?.message?.content || '').trim().toLowerCase();
    const hit = keys.find((k) => out.includes(k));
    return hit || DEFAULT_AGENT;
  } catch (err) {
    console.error('[router] falling back to default:', err?.message || err);
    return DEFAULT_AGENT; // fail safe to support
  }
}

/** Build the full system prompt for an agent: knowledge + role + style + rules. */
function systemPrompt(agent) {
  return [
    knowledgeFor(agent.knowledge),
    `# YOUR ROLE\n\nYou are the **${agent.label}** for XB2BX.\n\n${agent.instructions}`,
    STYLE,
    COMPLIANCE
  ].join('\n\n---\n\n');
}

/** Normalise inbound chat history into OpenAI message shape. */
function toOpenAIMessages(messages) {
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-14)
    .map((m) => ({ role: m.role, content: textOf(m.content) }));
}

/**
 * Generate a reply for the chosen agent, running tools as needed.
 * Returns { reply, agent, actions }.
 */
export async function reply(messages, agentKey) {
  const agent = AGENTS[agentKey] || AGENTS[DEFAULT_AGENT];

  const convo = [
    { role: 'system', content: systemPrompt(agent) },
    ...toOpenAIMessages(messages)
  ];

  const tools = toolsFor(agent.tools);
  const actionsTaken = [];

  for (let hop = 0; hop < CONFIG.maxToolHops; hop++) {
    const resp = await client.chat.completions.create({
      model: CONFIG.mainModel,
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
      messages: convo,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? 'auto' : undefined
    });

    const msg = resp.choices[0]?.message;
    if (!msg) break;

    // The model wants to call one or more tools.
    if (msg.tool_calls?.length) {
      // Push the assistant turn (with its tool_calls) verbatim.
      convo.push(msg);

      for (const call of msg.tool_calls) {
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
      continue; // let the model use the tool results
    }

    // Final answer.
    return {
      reply: (msg.content || '').trim() ||
        "I'm here to help — could you tell me a little more about what you need?",
      agent: agent.label,
      actions: actionsTaken
    };
  }

  return {
    reply:
      "I've gathered what I can for now. Let me connect you with the XB2BX team to take this further. ✅",
    agent: agent.label,
    actions: actionsTaken
  };
}
