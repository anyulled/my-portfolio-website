import * as Sentry from "@sentry/nextjs";
import { registerOTel } from "@vercel/otel";
import { SamplingDecision } from "@opentelemetry/sdk-trace-base";
import { Context, trace } from "@opentelemetry/api";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  registerOTel({
    serviceName: "boudoir-barcelona-app",
    traceExporter: "auto",
    spanProcessors: ["auto"],
    traceSampler: {
      shouldSample: (context: Context) => {
        const isChecklySpan = trace
          .getSpan(context)
          ?.spanContext()
          ?.traceState?.get("checkly");
        if (isChecklySpan) {
          console.log(
            "Sampling decision for Checkly span:",
            SamplingDecision.RECORD_AND_SAMPLED,
          );
          return {
            decision: SamplingDecision.RECORD_AND_SAMPLED,
          };
        } else {
          console.log(
            "Sampling decision for non-Checkly span:",
            SamplingDecision.NOT_RECORD,
          );
          return {
            decision: SamplingDecision.NOT_RECORD,
          };
        }
      },
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
