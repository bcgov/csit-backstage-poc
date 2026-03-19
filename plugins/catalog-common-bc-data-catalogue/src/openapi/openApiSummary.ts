import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yaml';

type ParsedOpenApiDocument = Record<string, any>;

const OPENAPI_HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

export type OpenApiSummary = {
  securityRequirements: string[];
  environments: string[];
};

export async function parseOpenApiDocument(
  definition: unknown,
): Promise<ParsedOpenApiDocument | undefined> {
  if (!definition) {
    return undefined;
  }

  try {
    let parsedInput: any = definition;

    if (typeof definition === 'string') {
      // Try YAML first (handles JSON too, but we’ll keep fallback explicit)
      try {
        parsedInput = YAML.parse(definition);
      } catch {
        try {
          parsedInput = JSON.parse(definition);
        } catch {
          return undefined;
        }
      }
    }

    const parsed = await SwaggerParser.parse(parsedInput);

    if (parsed && typeof parsed === 'object') {
      return parsed as ParsedOpenApiDocument;
    }
  } catch {
    // ignore parse errors
  }

  return undefined;
}

export async function getOpenApiSummary(
  definition: unknown,
): Promise<OpenApiSummary> {
  const doc = await parseOpenApiDocument(definition);

  return {
    securityRequirements: getOpenApiSecurityRequirements(doc),
    environments: getOpenApiEnvironmentLabels(doc),
  };
}

function getOpenApiVersion(
  doc: ParsedOpenApiDocument | undefined,
): '2' | '3' | undefined {
  if (!doc) {
    return undefined;
  }

  if (typeof doc.swagger === 'string' && doc.swagger.startsWith('2.')) {
    return '2';
  }

  if (typeof doc.openapi === 'string' && doc.openapi.startsWith('3.')) {
    return '3';
  }

  return undefined;
}

function normalizeEnvironmentLabel(value: string): string | undefined {
  const text = value.toLowerCase();

  if (/(^|[\W_])(dev|development)([\W_]|$)/.test(text)) return 'Dev';
  if (/(^|[\W_])(test|testing)([\W_]|$)/.test(text)) return 'Test';
  if (/(^|[\W_])(qa)([\W_]|$)/.test(text)) return 'QA';
  if (/(^|[\W_])(uat)([\W_]|$)/.test(text)) return 'UAT';
  if (/(^|[\W_])(stage|staging)([\W_]|$)/.test(text)) return 'Stage';
  if (/(^|[\W_])(prod|production)([\W_]|$)/.test(text)) return 'Prod';
  if (/(^|[\W_])(sandbox)([\W_]|$)/.test(text)) return 'Sandbox';
  if (/(^|[\W_])(local|localhost)([\W_]|$)/.test(text)) return 'Local';

  return undefined;
}

function inferEnvironmentFromUrlOrDescription(
  url?: string,
  description?: string,
): string | undefined {
  return (
    (description && normalizeEnvironmentLabel(description)) ||
    (url && normalizeEnvironmentLabel(url))
  );
}

function getOpenApiEnvironmentLabels(
  doc: ParsedOpenApiDocument | undefined,
): string[] {
  const version = getOpenApiVersion(doc);
  if (!doc || !version) return [];

  const labels = new Set<string>();

  if (version === '3') {
    const servers = Array.isArray(doc.servers) ? doc.servers : [];

    for (const server of servers) {
      const url =
        typeof server?.url === 'string' ? server.url : undefined;
      const description =
        typeof server?.description === 'string'
          ? server.description
          : undefined;

      const label = inferEnvironmentFromUrlOrDescription(url, description);
      if (label) {
        labels.add(label);
        continue;
      }

      if (url) {
        try {
          const parsed = new URL(url);
          if (parsed.hostname) {
            labels.add(parsed.hostname);
          }
        } catch {
          // ignore unlabeled relative URLs
        }
      }
    }
  } else if (version === '2') {
    const schemes = Array.isArray(doc.schemes) ? doc.schemes : [];
    const host = typeof doc.host === 'string' ? doc.host : '';
    const basePath = typeof doc.basePath === 'string' ? doc.basePath : '';

    if (host) {
      if (schemes.length > 0) {
        for (const scheme of schemes) {
          const url = `${scheme}://${host}${basePath}`;
          const label = inferEnvironmentFromUrlOrDescription(url);
          if (label) {
            labels.add(label);
          } else {
            labels.add(host);
          }
        }
      } else {
        const label = inferEnvironmentFromUrlOrDescription(`${host}${basePath}`);
        if (label) {
          labels.add(label);
        } else {
          labels.add(host);
        }
      }
    }
  }

  return Array.from(labels);
}

function formatSecuritySchemeLabel(scheme: any): string {
  if (!scheme || typeof scheme !== 'object') return 'Security';

  if (scheme.type === 'oauth2') return 'OAuth2';
  if (scheme.type === 'openIdConnect') return 'OpenID Connect';
  if (scheme.type === 'mutualTLS') return 'mTLS';

  if (scheme.type === 'apiKey') {
    if (scheme.in === 'header') return 'API Key Header';
    if (scheme.in === 'query') return 'API Key Query';
    if (scheme.in === 'cookie') return 'API Key Cookie';
    return 'API Key';
  }

  if (scheme.type === 'http') {
    const httpScheme = String(scheme.scheme ?? '').toLowerCase();
    if (httpScheme === 'basic') return 'Basic Auth';
    if (httpScheme === 'bearer') {
      return scheme.bearerFormat
        ? `Bearer (${scheme.bearerFormat})`
        : 'Bearer';
    }
    return httpScheme ? httpScheme.toUpperCase() : 'HTTP Auth';
  }

  return String(scheme.type ?? 'Security');
}

function getOperationObjects(doc: ParsedOpenApiDocument | undefined): any[] {
  if (!doc?.paths) return [];

  const operations: any[] = [];

  for (const pathItem of Object.values(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = (pathItem as Record<string, any>)[method];
      if (operation && typeof operation === 'object') {
        operations.push(operation);
      }
    }
  }

  return operations;
}

function getOpenApiSecurityRequirements(
  doc: ParsedOpenApiDocument | undefined,
): string[] {
  const version = getOpenApiVersion(doc);
  if (!doc || !version) return [];

  const securitySchemes =
    version === '3'
      ? doc.components?.securitySchemes
      : doc.securityDefinitions;

  if (!securitySchemes || typeof securitySchemes !== 'object') return [];

  let securityRequirements = Array.isArray(doc.security)
    ? doc.security
    : undefined;

  if (!securityRequirements?.length) {
    const operations = getOperationObjects(doc);
    const operationRequirements = operations
      .flatMap(op => (Array.isArray(op.security) ? op.security : []))
      .filter(Boolean);

    if (operationRequirements.length) {
      securityRequirements = operationRequirements;
    }
  }

  const results = new Set<string>();

  if (securityRequirements?.length) {
    for (const requirement of securityRequirements) {
      if (!requirement || typeof requirement !== 'object') continue;

      const labels = Object.keys(requirement)
        .map(name =>
          formatSecuritySchemeLabel(
            (securitySchemes as Record<string, any>)[name],
          ),
        )
        .filter(Boolean);

      if (labels.length) {
        results.add(labels.join(' + ')); // preserve AND
      }
    }
  }

  // fallback: just list defined schemes
  if (!results.size) {
    Object.values(securitySchemes).forEach(scheme => {
      results.add(formatSecuritySchemeLabel(scheme));
    });
  }

  return Array.from(results);
}