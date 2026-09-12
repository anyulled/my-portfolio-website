const serverImportPrefixes = [
  "node:",
  "@/lib/gcp/",
  "@/services/database",
  "@/services/storage/",
  "@/services/booking/repository",
  "@/services/instagram/repository",
  "@google-cloud/storage",
  "@supabase/supabase-js",
  "@upstash/redis",
  "@vercel/blob",
];

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent server integration imports from client modules",
    },
    messages: {
      serverImport:
        "Client modules cannot import server integration '{{importSource}}'. Move the operation behind a Server Component, Server Action, or Route Handler.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(programNode) {
        const clientModule = programNode.body.some(
          (statement) =>
            statement.type === "ExpressionStatement" &&
            statement.directive === "use client",
        );
        if (!clientModule) {
          return;
        }

        programNode.body.forEach((statement) => {
          if (statement.type !== "ImportDeclaration") {
            return;
          }

          const importSource = statement.source.value;
          const serverImport = serverImportPrefixes.some((prefix) =>
            importSource.startsWith(prefix),
          );
          if (serverImport) {
            context.report({
              node: statement.source,
              messageId: "serverImport",
              data: { importSource },
            });
          }
        });
      },
    };
  },
};
