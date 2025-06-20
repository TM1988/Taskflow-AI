// Shared in-memory storage for organizations
export const organizationsStore: any[] = [];
export let orgIdCounter = 1;

export function getNextOrgId(): string {
  return `org-${orgIdCounter++}`;
}

export function addOrganization(org: any): void {
  organizationsStore.push(org);
}

export function getOrganizations(): any[] {
  return organizationsStore;
}

export function getOrganizationById(id: string): any | undefined {
  return organizationsStore.find(org => org.id === id);
}

export function updateOrganization(id: string, updates: any): any | null {
  const index = organizationsStore.findIndex(org => org.id === id);
  if (index === -1) return null;
  
  organizationsStore[index] = {
    ...organizationsStore[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return organizationsStore[index];
}

export function deleteOrganization(id: string): boolean {
  const index = organizationsStore.findIndex(org => org.id === id);
  if (index === -1) return false;
  
  organizationsStore.splice(index, 1);
  return true;
}
