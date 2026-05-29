import type { MiddlewareHandler } from 'hono';

export type SessionContext = {
  owner: string;
  activePersonaName?: string;
  agentName?: string;
  allowedAudiences: string[];
};

export const getAllowedAudiences = (activePersonaName?: string, agentName?: string): string[] => {
  const allowed = new Set<string>();
  if (activePersonaName) allowed.add(activePersonaName);
  if (agentName) allowed.add(agentName);
  
  // Standard fallback names for the agent
  allowed.add('assistant');
  allowed.add('SolidChatAgent');
  allowed.add('Global Default');
  
  return Array.from(allowed);
};

export const sessionContextMiddleware: MiddlewareHandler = async (c, next) => {
  // Extract owner from JWT payload (assumes jwt middleware ran first)
  const payload = c.get('jwtPayload') as any;
  const owner = payload?.username;

  // If no owner is found (e.g. not an authenticated route), just proceed
  if (!owner) {
    return next();
  }

  // Extract custom headers
  const personaHeader = c.req.header('X-Active-Persona');
  const agentHeader = c.req.header('X-Active-Agent');

  const activePersonaName = personaHeader ? decodeURIComponent(personaHeader) : undefined;
  const agentName = agentHeader ? decodeURIComponent(agentHeader) : undefined;

  const allowedAudiences = getAllowedAudiences(activePersonaName, agentName);

  const sessionContext: SessionContext = {
    owner,
    activePersonaName,
    agentName,
    allowedAudiences
  };

  c.set('sessionContext', sessionContext);
  await next();
};
