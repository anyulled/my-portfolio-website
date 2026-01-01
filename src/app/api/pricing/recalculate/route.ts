import chalk from "chalk";
import { NextResponse } from "next/server";

import {
  getLatestPricing,
  insertPricing,
  PricingPackageInsert,
} from "@/services/database";
import { fetchLatestIpc } from "@/services/ipc";
import { sendEmailToRecipient } from "@/services/mailer";

function adjustPrice(
  value: number | null,
  adjustmentFactor: number,
): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const adjusted = value * adjustmentFactor;
  return Number.isFinite(adjusted)
    ? Number.parseFloat(adjusted.toFixed(2))
    : null;
}

function buildUnauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized",
    },
    { status: 401 },
  );
}

function checkAuth(req: Request) {
  const url = new URL(req.url);
  const isCronInvocation = req.headers.has("x-vercel-cron");
  const providedToken =
    url.searchParams.get("token") ?? req.headers.get("x-cron-secret");
  const requiredSecret = process.env.PRICING_RECALC_SECRET;

  if (!isCronInvocation) {
    if (!requiredSecret) {
      console.warn(
        chalk.yellow(
          "[ pricing:recalculate ] Manual invocation attempted without PRICING_RECALC_SECRET configured",
        ),
      );
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "Manual recalculation is disabled. Configure PRICING_RECALC_SECRET to enable it.",
          },
          { status: 503 },
        ),
      };
    }

    if (providedToken !== requiredSecret) {
      console.warn(
        chalk.red(
          "[ pricing:recalculate ] Manual invocation rejected due to invalid token",
        ),
      );
      return { authorized: false, response: buildUnauthorizedResponse() };
    }
  } else if (
    requiredSecret &&
    providedToken &&
    providedToken !== requiredSecret
  ) {
    console.warn(
      chalk.red(
        "[ pricing:recalculate ] Cron invocation provided invalid token",
      ),
    );
    return { authorized: false, response: buildUnauthorizedResponse() };
  }

  return { authorized: true, isCronInvocation, response: null };
}

export async function GET(req: Request) {
  const { authorized, response, isCronInvocation } = checkAuth(req);
  if (!authorized && response) return response;

  try {
    console.log(
      chalk.gray("[ pricing:recalculate ] Fetching latest stored pricing"),
    );
    const latestPricing = await getLatestPricing();

    if (!latestPricing) {
      console.warn(
        chalk.yellow(
          "[ pricing:recalculate ] No pricing data available to recalculate",
        ),
      );
      return NextResponse.json(
        {
          success: false,
          error: "No pricing data available to recalculate.",
        },
        { status: 404 },
      );
    }

    console.log(
      chalk.gray("[ pricing:recalculate ] Fetching latest IPC percentage"),
    );
    const ipcPercentage = await fetchLatestIpc();
    const adjustmentFactor = 1 + ipcPercentage / 100;

    const recalculated: PricingPackageInsert = {
      express_price: adjustPrice(latestPricing.express_price, adjustmentFactor),
      experience_price: adjustPrice(
        latestPricing.experience_price,
        adjustmentFactor,
      ),
      deluxe_price: adjustPrice(latestPricing.deluxe_price, adjustmentFactor),
    };

    console.log(
      chalk.gray("[ pricing:recalculate ] Persisting recalculated pricing"),
    );
    const inserted = await insertPricing(recalculated);

    if (!inserted) {
      throw new Error("Failed to persist recalculated pricing");
    }

    // Send email notification

    const emailRecipient =
      process.env.CRON_NOTIFICATION_EMAIL || "anyulled@gmail.com";
    const emailSubject = `[Pricing] Recalculation Complete (IPC: ${ipcPercentage}%)`;
    const emailBody = `
      Pricing recalculation completed successfully.
      
      IPC Percentage Used: ${ipcPercentage}%
      Adjustment Factor: ${adjustmentFactor}
      
      New Pricing:
      - Express: ${inserted.express_price}
      - Experience: ${inserted.experience_price}
      - Deluxe: ${inserted.deluxe_price}
      
      Triggered by: ${isCronInvocation ? "Cron" : "Manual"}
    `;

    await sendEmailToRecipient(emailBody, emailRecipient, emailSubject);

    return NextResponse.json({
      success: true,
      data: inserted,
      meta: {
        ipcPercentage,
        adjustmentFactor,
        source: "https://servicios.ine.es",
        triggeredBy: isCronInvocation ? "cron" : "manual",
      },
    });
  } catch (error) {
    console.error(
      chalk.red("[ pricing:recalculate ] Error recalculating pricing"),
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to recalculate pricing. Check server logs for details.",
      },
      { status: 500 },
    );
  }
}

export const POST = GET;
