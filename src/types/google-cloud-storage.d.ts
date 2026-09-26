declare module "@google-cloud/storage" {
  export class Storage {
    constructor(options?: {
      projectId?: string;
      credentials?: {
        client_email?: string;
        private_key?: string;
      };
    });
    bucket(name: string): {
      file(name: string): {
        save(data: Buffer, options?: unknown): Promise<unknown>;
        delete(): Promise<unknown>;
        publicUrl(): string;
      };
      getFiles(options?: {
        autoPaginate?: boolean;
        maxResults?: number;
        prefix?: string;
      }): Promise<
        [
          Array<{
            name: string;
            metadata?: {
              metadata?: Record<string, string | undefined>;
              updated?: string;
            };
            publicUrl(): string;
          }>,
        ]
      >;
    };
  }
}
