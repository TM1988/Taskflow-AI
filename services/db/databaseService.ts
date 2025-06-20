// services/db/databaseService.ts
export interface DatabaseConfig {
  useOfficialMongoDB: boolean;
  useCustomMongoDB: boolean;
  connectionString?: string;
  databaseName?: string;
}

export const databaseService = {
  async getDatabaseConfig(userId: string): Promise<DatabaseConfig | null> {
    try {
      const response = await fetch(`/api/db/config?userId=${userId}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.config || null;
    } catch (error) {
      console.error('Error fetching database config:', error);
      return null;
    }
  }
};
