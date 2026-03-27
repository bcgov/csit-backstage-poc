export class BcDataCatalogueNaming {
  toSafeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(?:^[-_.]+|[-_.]+$)/g, '')
      .slice(0, 63)
      .replace(/[-_.]+$/, '');
  }

  getSystemId(name: string): string {
    return `system:default/${this.toSafeName(name)}`;
  }

  getGroupId(hostName: string): string {
    return `group:default/${this.toSafeName(hostName)}`;
  }

  getUserId(email: string): string {
    return `user:default/${email.toLowerCase()}`;
  }

  getComponentId(name: string): string {
    return `component:default/${name.toLowerCase()}`;
  }

  getDatasetId(name: string): string {
    return `dataset:default/${name.toLowerCase()}`;
  }

  getApiId(name: string): string {
    return `api:default/${name.toLowerCase()}`;
  }

  getOpenApiId(name: string): string {
    return `openapi:default/${name.toLowerCase()}`;
  }

  extractDistinguishingSuffix(resourceName: string): string {
    const safeName = this.toSafeName(resourceName);

    const yearMatch = resourceName.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return yearMatch[0];
    }

    const versionMatch = resourceName.match(/\b(?:v|version)[\s_-]?(\d+)\b/i);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }

    const trailingNumberMatch = resourceName.match(/\b(\d{2,})\b/);
    if (trailingNumberMatch) {
      return trailingNumberMatch[0];
    }

    const words = safeName
      .split('-')
      .filter(
        w =>
          w.length > 0 &&
          ![
            'service',
            'request',
            'getcapabilities',
            'wms',
            'kml',
            'arcgis',
            'rest',
            'online',
          ].includes(w),
      );

    if (words.length >= 2) {
      return words.slice(-2).join('-');
    }

    if (words.length === 1) {
      return words[0];
    }

    return safeName.split('-').slice(-1)[0].slice(0, 10);
  }
}