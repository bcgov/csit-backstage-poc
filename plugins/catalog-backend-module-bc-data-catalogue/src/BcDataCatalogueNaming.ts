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

  getResourceId(name: string): string {
    return `resource:default/${name.toLowerCase()}`;
  }
}
