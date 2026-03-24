# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FusionClaw, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email: **rob@fusiondataco.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 1 week
- **Fix**: Depending on severity, typically within 2 weeks

### Scope

The following are in scope:
- Authentication bypass
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Remote code execution
- Privilege escalation
- Data exposure

### Out of Scope

- Denial of service attacks
- Social engineering
- Physical security
- Third-party services (Neon, Vercel, OpenRouter, fal.ai)

## Security Architecture

- JWT-based session authentication with constant-time comparison
- MCP API key authentication for agent access
- Zod validation on all API mutation endpoints
- Rate limiting on authentication endpoints
- File upload validation (type whitelist, size limits)
- Environment variables for all secrets (never committed to repo)
