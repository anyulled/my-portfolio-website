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
      getFiles(options?: { autoPaginate?: boolean }): Promise<
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
