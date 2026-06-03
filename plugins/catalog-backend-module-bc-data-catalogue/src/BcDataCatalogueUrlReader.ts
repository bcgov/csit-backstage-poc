import {
  LoggerService,
  UrlReaderService as BackstageUrlReaderService,
  UrlReaderServiceReadTreeOptions,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadUrlOptions,
  UrlReaderServiceReadUrlResponse,
  UrlReaderServiceSearchOptions,
  UrlReaderServiceSearchResponse,
} from '@backstage/backend-plugin-api';

type BcDataCatalogueUrlReaderOptions = {
  reader: BackstageUrlReaderService;
  allowedHosts: string[];
  logger: LoggerService;
};

export interface UrlReaderService extends BackstageUrlReaderService {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

export class BcDataCatalogueUrlReader implements UrlReaderService {
  private readonly reader: BackstageUrlReaderService;
  private readonly allowedHosts: string[];
  private readonly logger: LoggerService;

  constructor(options: BcDataCatalogueUrlReaderOptions) {
    this.reader = options.reader;
    this.allowedHosts = options.allowedHosts.map(host => host.toLowerCase());
    this.logger = options.logger;
  }

  readUrl(
    url: string,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    return this.reader.readUrl(url, options);
  }

  readTree(
    url: string,
    options?: UrlReaderServiceReadTreeOptions,
  ): Promise<UrlReaderServiceReadTreeResponse> {
    return this.reader.readTree(url, options);
  }

  search(
    url: string,
    options?: UrlReaderServiceSearchOptions,
  ): Promise<UrlReaderServiceSearchResponse> {
    return this.reader.search(url, options);
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const host = this.getUrlHost(url);

    if (!host || !this.allowedHosts.includes(host)) {
      this.logger.warn(
        `[BCDC URL Reader] Outbound request host is NOT allowed: "${
          host ?? url
        }"`,
      );

      throw new Error(`URL host is not allowed: ${host ?? url}`);
    }

    return fetch(url, init);
  }

  private getUrlHost(url: string): string | undefined {
    try {
      return new URL(url).host.toLowerCase();
    } catch {
      return undefined;
    }
  }
}
