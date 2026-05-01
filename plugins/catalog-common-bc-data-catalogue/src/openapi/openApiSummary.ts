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

type OpenApiVersion = '2' | '3';

export type OpenApiSummaryLink = {
  url: string;
  title?: string;
  type?: string;
};

export type OpenApiSummaryEnvironment = {
  url: string;
  description?: string;
  label?: string;
};

export type OpenApiSummaryEndpoint = {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  authentication?: string;
  exampleRequest?: string;
  exampleResponse?: string;
};

export type OpenApiSummarySchemaField = {
  name: string;
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
};

export type OpenApiSummarySchemaObject = {
  name: string;
  label?: string;
  description?: string;
  fields?: OpenApiSummarySchemaField[];
};

export type OpenApiSummary = {
  title?: string;
  description?: string;
  version?: string;
  specificationVersion?: string;
  tags: string[];
  links: OpenApiSummaryLink[];
  securityRequirements: string[];
  environments: OpenApiSummaryEnvironment[];
  endpoints: OpenApiSummaryEndpoint[];
  schemas: OpenApiSummarySchemaObject[];
};

export async function parseOpenApiDocument(
  definition: unknown,
): Promise<ParsedOpenApiDocument | undefined> {
  if (!definition) {
    return undefined;
  }

  try {
    let parsedInput: unknown = definition;

    if (typeof definition === 'string') {
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

    if (!parsedInput || typeof parsedInput !== 'object') {
      return undefined;
    }

    const parsed = await SwaggerParser.parse(parsedInput as object);

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
    title: getOpenApiTitle(doc),
    description: getOpenApiDescription(doc),
    version: getOpenApiInfoVersion(doc),
    specificationVersion: getOpenApiSpecificationVersion(doc),
    tags: getOpenApiTags(doc),
    links: getOpenApiLinks(doc),
    securityRequirements: getOpenApiSecurityRequirements(doc),
    environments: getOpenApiEnvironments(doc),
    endpoints: getOpenApiEndpoints(doc),
    schemas: getOpenApiSchemas(doc),
  };
}

function getOpenApiVersion(
  doc: ParsedOpenApiDocument | undefined,
): OpenApiVersion | undefined {
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

function getOpenApiSpecificationVersion(
  doc: ParsedOpenApiDocument | undefined,
): string | undefined {
  if (!doc) {
    return undefined;
  }

  if (typeof doc.openapi === 'string' && doc.openapi.trim().length > 0) {
    return doc.openapi;
  }

  if (typeof doc.swagger === 'string' && doc.swagger.trim().length > 0) {
    return doc.swagger;
  }

  return undefined;
}

function getOpenApiTitle(
  doc: ParsedOpenApiDocument | undefined,
): string | undefined {
  return typeof doc?.info?.title === 'string' ? doc.info.title : undefined;
}

function getOpenApiDescription(
  doc: ParsedOpenApiDocument | undefined,
): string | undefined {
  return typeof doc?.info?.description === 'string'
    ? doc.info.description
    : undefined;
}

function getOpenApiInfoVersion(
  doc: ParsedOpenApiDocument | undefined,
): string | undefined {
  return typeof doc?.info?.version === 'string' ? doc.info.version : undefined;
}

function getOpenApiTags(doc: ParsedOpenApiDocument | undefined): string[] {
  if (!Array.isArray(doc?.tags)) {
    return [];
  }

  return doc.tags
    .map((tag: unknown) => {
      if (!tag || typeof tag !== 'object') {
        return undefined;
      }

      const name = (tag as Record<string, unknown>).name;
      return typeof name === 'string' && name.trim().length > 0
        ? name.trim()
        : undefined;
    })
    .filter((value): value is string => Boolean(value));
}

function getOpenApiLinks(
  doc: ParsedOpenApiDocument | undefined,
): OpenApiSummaryLink[] {
  const links: OpenApiSummaryLink[] = [];

  const externalDocs = doc?.externalDocs;
  if (
    externalDocs &&
    typeof externalDocs === 'object' &&
    typeof externalDocs.url === 'string' &&
    externalDocs.url.trim().length > 0
  ) {
    links.push({
      url: externalDocs.url,
      title:
        typeof externalDocs.description === 'string' &&
        externalDocs.description.trim().length > 0
          ? externalDocs.description
          : 'External Documentation',
      type: 'externalDocs',
    });
  }

  return links;
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

function inferEnvironmentLabel(
  url?: string,
  description?: string,
): string | undefined {
  return (
    (description && normalizeEnvironmentLabel(description)) ||
    (url && normalizeEnvironmentLabel(url))
  );
}

function getOpenApiEnvironments(
  doc: ParsedOpenApiDocument | undefined,
): OpenApiSummaryEnvironment[] {
  const version = getOpenApiVersion(doc);
  if (!doc || !version) return [];

  const environments: OpenApiSummaryEnvironment[] = [];

  if (version === '3') {
    const servers = Array.isArray(doc.servers) ? doc.servers : [];

    for (const server of servers) {
      const url = typeof server?.url === 'string' ? server.url.trim() : '';
      const description =
        typeof server?.description === 'string'
          ? server.description.trim()
          : undefined;

      if (!url) {
        continue;
      }

      environments.push({
        url,
        description: description || undefined,
        label: inferEnvironmentLabel(url, description),
      });
    }
  } else {
    const schemes = Array.isArray(doc.schemes)
      ? doc.schemes.filter(
          (scheme: unknown): scheme is string =>
            typeof scheme === 'string' && scheme.trim().length > 0,
        )
      : [];
    const host = typeof doc.host === 'string' ? doc.host.trim() : '';
    const basePath = typeof doc.basePath === 'string' ? doc.basePath : '';

    if (host) {
      if (schemes.length > 0) {
        for (const scheme of schemes) {
          const url = `${scheme}://${host}${basePath}`;
          environments.push({
            url,
            label: inferEnvironmentLabel(url),
          });
        }
      } else {
        const url = `${host}${basePath}`;
        environments.push({
          url,
          label: inferEnvironmentLabel(url),
        });
      }
    }
  }

  return dedupeEnvironments(environments);
}

function dedupeEnvironments(
  environments: OpenApiSummaryEnvironment[],
): OpenApiSummaryEnvironment[] {
  const deduped = new Map<string, OpenApiSummaryEnvironment>();

  for (const environment of environments) {
    const existing = deduped.get(environment.url);
    if (!existing) {
      deduped.set(environment.url, environment);
      continue;
    }

    deduped.set(environment.url, {
      url: existing.url,
      description: existing.description ?? environment.description,
      label: existing.label ?? environment.label,
    });
  }

  return Array.from(deduped.values());
}

function formatSecuritySchemeLabel(scheme: unknown): string {
  if (!scheme || typeof scheme !== 'object') return 'Security';

  const typed = scheme as Record<string, any>;

  if (typed.type === 'oauth2') return 'OAuth2';
  if (typed.type === 'openIdConnect') return 'OpenID Connect';
  if (typed.type === 'mutualTLS') return 'mTLS';

  if (typed.type === 'apiKey') {
    if (typed.in === 'header') return 'API Key Header';
    if (typed.in === 'query') return 'API Key Query';
    if (typed.in === 'cookie') return 'API Key Cookie';
    return 'API Key';
  }

  if (typed.type === 'http') {
    const httpScheme = String(typed.scheme ?? '').toLowerCase();
    if (httpScheme === 'basic') return 'Basic Auth';
    if (httpScheme === 'bearer') {
      return typed.bearerFormat ? `Bearer (${typed.bearerFormat})` : 'Bearer';
    }
    return httpScheme ? httpScheme.toUpperCase() : 'HTTP Auth';
  }

  return String(typed.type ?? 'Security');
}

function getSecuritySchemes(
  doc: ParsedOpenApiDocument | undefined,
  version: OpenApiVersion,
): Record<string, unknown> {
  const raw =
    version === '3' ? doc?.components?.securitySchemes : doc?.securityDefinitions;

  return raw && typeof raw === 'object'
    ? (raw as Record<string, unknown>)
    : {};
}

function formatRequirementLabels(
  requirement: unknown,
  securitySchemes: Record<string, unknown>,
): string | undefined {
  if (!requirement || typeof requirement !== 'object') {
    return undefined;
  }

  const labels = Object.keys(requirement as Record<string, unknown>)
    .map(name => formatSecuritySchemeLabel(securitySchemes[name]))
    .filter(Boolean);

  return labels.length > 0 ? labels.join(' + ') : undefined;
}

function getOperationEntries(
  doc: ParsedOpenApiDocument | undefined,
): Array<{ path: string; method: string; operation: Record<string, any> }> {
  if (!doc?.paths || typeof doc.paths !== 'object') {
    return [];
  }

  const operations: Array<{
    path: string;
    method: string;
    operation: Record<string, any>;
  }> = [];

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];
      if (operation && typeof operation === 'object') {
        operations.push({
          path,
          method: method.toUpperCase(),
          operation: operation as Record<string, any>,
        });
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

  const securitySchemes = getSecuritySchemes(doc, version);
  if (!Object.keys(securitySchemes).length) return [];

  let securityRequirements = Array.isArray(doc.security)
    ? doc.security
    : undefined;

  if (!securityRequirements?.length) {
    const operationRequirements = getOperationEntries(doc)
      .flatMap(entry =>
        Array.isArray(entry.operation.security) ? entry.operation.security : [],
      )
      .filter(Boolean);

    if (operationRequirements.length > 0) {
      securityRequirements = operationRequirements;
    }
  }

  const results = new Set<string>();

  if (securityRequirements?.length) {
    for (const requirement of securityRequirements) {
      const label = formatRequirementLabels(requirement, securitySchemes);
      if (label) {
        results.add(label);
      }
    }
  }

  if (!results.size) {
    Object.values(securitySchemes).forEach(scheme => {
      results.add(formatSecuritySchemeLabel(scheme));
    });
  }

  return Array.from(results);
}

function getOperationSecurityLabel(
  operation: Record<string, any>,
  doc: ParsedOpenApiDocument,
  version: OpenApiVersion,
): string | undefined {
  const securitySchemes = getSecuritySchemes(doc, version);
  if (!Object.keys(securitySchemes).length) {
    return undefined;
  }

  const operationSecurity = Array.isArray(operation.security)
    ? operation.security
    : undefined;
  const documentSecurity = Array.isArray(doc.security) ? doc.security : undefined;

  const effectiveSecurity =
    operationSecurity && operationSecurity.length > 0
      ? operationSecurity
      : documentSecurity && documentSecurity.length > 0
        ? documentSecurity
        : undefined;

  if (!effectiveSecurity?.length) {
    return undefined;
  }

  const labels = effectiveSecurity
    .map(requirement => formatRequirementLabels(requirement, securitySchemes))
    .filter((value): value is string => Boolean(value));

  return labels.length > 0 ? labels.join(' OR ') : undefined;
}

function toExampleText(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : undefined;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getOas3RequestExample(operation: Record<string, any>): string | undefined {
  const requestBody = operation.requestBody;
  if (!requestBody || typeof requestBody !== 'object') {
    return undefined;
  }

  const content =
    requestBody.content && typeof requestBody.content === 'object'
      ? (requestBody.content as Record<string, any>)
      : undefined;

  if (!content) {
    return undefined;
  }

  for (const mediaType of Object.values(content)) {
    if (!mediaType || typeof mediaType !== 'object') continue;

    if ('example' in mediaType) {
      const example = toExampleText((mediaType as Record<string, unknown>).example);
      if (example) return example;
    }

    const examples =
      (mediaType as Record<string, unknown>).examples &&
      typeof (mediaType as Record<string, unknown>).examples === 'object'
        ? ((mediaType as Record<string, unknown>).examples as Record<string, any>)
        : undefined;

    if (examples) {
      for (const exampleValue of Object.values(examples)) {
        if (exampleValue && typeof exampleValue === 'object' && 'value' in exampleValue) {
          const example = toExampleText(
            (exampleValue as Record<string, unknown>).value,
          );
          if (example) return example;
        }
      }
    }
  }

  return undefined;
}

function getSwagger2RequestExample(operation: Record<string, any>): string | undefined {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];

  for (const parameter of parameters) {
    if (!parameter || typeof parameter !== 'object') continue;

    if ('example' in parameter) {
      const example = toExampleText((parameter as Record<string, unknown>).example);
      if (example) return example;
    }

    const schema =
      (parameter as Record<string, unknown>).schema &&
      typeof (parameter as Record<string, unknown>).schema === 'object'
        ? ((parameter as Record<string, unknown>).schema as Record<string, unknown>)
        : undefined;

    if (schema && 'example' in schema) {
      const example = toExampleText(schema.example);
      if (example) return example;
    }

    if ('x-example' in parameter) {
      const example = toExampleText(
        (parameter as Record<string, unknown>)['x-example'],
      );
      if (example) return example;
    }
  }

  return undefined;
}

function getResponseExample(operation: Record<string, any>): string | undefined {
  const responses =
    operation.responses && typeof operation.responses === 'object'
      ? (operation.responses as Record<string, any>)
      : undefined;

  if (!responses) {
    return undefined;
  }

  const orderedKeys = Object.keys(responses).sort((a, b) => {
    if (a === 'default') return 1;
    if (b === 'default') return -1;
    return a.localeCompare(b);
  });

  for (const key of orderedKeys) {
    const response = responses[key];
    if (!response || typeof response !== 'object') continue;

    const content =
      response.content && typeof response.content === 'object'
        ? (response.content as Record<string, any>)
        : undefined;

    if (content) {
      for (const mediaType of Object.values(content)) {
        if (!mediaType || typeof mediaType !== 'object') continue;

        if ('example' in mediaType) {
          const example = toExampleText(
            (mediaType as Record<string, unknown>).example,
          );
          if (example) return example;
        }

        const examples =
          (mediaType as Record<string, unknown>).examples &&
          typeof (mediaType as Record<string, unknown>).examples === 'object'
            ? ((mediaType as Record<string, unknown>).examples as Record<
                string,
                any
              >)
            : undefined;

        if (examples) {
          for (const exampleValue of Object.values(examples)) {
            if (
              exampleValue &&
              typeof exampleValue === 'object' &&
              'value' in exampleValue
            ) {
              const example = toExampleText(
                (exampleValue as Record<string, unknown>).value,
              );
              if (example) return example;
            }
          }
        }
      }
    }

    if ('examples' in response) {
      const examples =
        (response as Record<string, unknown>).examples &&
        typeof (response as Record<string, unknown>).examples === 'object'
          ? ((response as Record<string, unknown>).examples as Record<
              string,
              unknown
            >)
          : undefined;

      if (examples) {
        for (const exampleValue of Object.values(examples)) {
          const example = toExampleText(exampleValue);
          if (example) return example;
        }
      }
    }

    const schema =
      response.schema && typeof response.schema === 'object'
        ? (response.schema as Record<string, unknown>)
        : undefined;

    if (schema && 'example' in schema) {
      const example = toExampleText(schema.example);
      if (example) return example;
    }

    if ('x-example' in response) {
      const example = toExampleText(
        (response as Record<string, unknown>)['x-example'],
      );
      if (example) return example;
    }
  }

  return undefined;
}

function getSchemaType(schema: Record<string, any>): string | undefined {
  if (typeof schema.type === 'string' && schema.type.trim().length > 0) {
    if (schema.type === 'array') {
      const items = schema.items;

      if (items && typeof items === 'object') {
        const itemType = getSchemaType(items as Record<string, any>);
        return itemType ? `array<${itemType}>` : 'array';
      }

      return 'array';
    }

    return schema.type;
  }

  if (typeof schema.$ref === 'string') {
    return schema.$ref.split('/').pop();
  }

  return undefined;
}

function getOpenApiSchemas(
  doc: ParsedOpenApiDocument | undefined,
): OpenApiSummarySchemaObject[] {
  const version = getOpenApiVersion(doc);
  if (!doc || !version) {
    return [];
  }

  const rawSchemas =
    version === '3' ? doc.components?.schemas : doc.definitions;

  if (!rawSchemas || typeof rawSchemas !== 'object') {
    return [];
  }

  const schemas: OpenApiSummarySchemaObject[] = [];

  for (const [schemaName, rawSchema] of Object.entries(rawSchemas)) {
    if (!rawSchema || typeof rawSchema !== 'object') {
      continue;
    }

    const schema = rawSchema as Record<string, any>;

    if (schema.type !== 'object') {
      continue;
    }

    const required = Array.isArray(schema.required)
      ? schema.required.filter(
          (value: unknown): value is string => typeof value === 'string',
        )
      : [];

    const properties =
      schema.properties && typeof schema.properties === 'object'
        ? (schema.properties as Record<string, any>)
        : undefined;

    const fields = properties
      ? Object.entries(properties).map(([fieldName, rawProperty]) => {
          const property =
            rawProperty && typeof rawProperty === 'object'
              ? (rawProperty as Record<string, any>)
              : {};

          return {
            name: fieldName,
            type: getSchemaType(property),
            format:
              typeof property.format === 'string' ? property.format : undefined,
            required: required.includes(fieldName),
            description:
              typeof property.description === 'string'
                ? property.description
                : undefined,
          };
        })
      : undefined;

    schemas.push({
      name: schemaName,
      label:
        typeof schema.title === 'string' && schema.title.trim().length > 0
          ? schema.title
          : schemaName,
      description:
        typeof schema.description === 'string' ? schema.description : undefined,
      fields,
    });
  }

  return schemas;
}

function getOpenApiEndpoints(
  doc: ParsedOpenApiDocument | undefined,
): OpenApiSummaryEndpoint[] {
  const version = getOpenApiVersion(doc);
  if (!doc || !version) {
    return [];
  }

  return getOperationEntries(doc).map(entry => ({
    path: entry.path,
    method: entry.method,
    summary:
      typeof entry.operation.summary === 'string'
        ? entry.operation.summary
        : undefined,
    description:
      typeof entry.operation.description === 'string'
        ? entry.operation.description
        : undefined,
    authentication: getOperationSecurityLabel(entry.operation, doc, version),
    exampleRequest:
      version === '3'
        ? getOas3RequestExample(entry.operation)
        : getSwagger2RequestExample(entry.operation),
    exampleResponse: getResponseExample(entry.operation),
  }));
}