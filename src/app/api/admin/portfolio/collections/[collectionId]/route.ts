import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  getPortfolioDatabase,
  setPortfolioCollectionArchived,
} from "@/services/portfolio/repository";
import { connection, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  await connection();
  if (!(await getAuthenticatedOperator())) {
    return NextResponse.json(
      { message: "An authorized operator session is required." },
      { status: 401 },
    );
  }
  if (isHarnessFixtureMode()) {
    return NextResponse.json(
      { message: "Portfolio editing is unavailable in fixture mode." },
      { status: 503 },
    );
  }

  const body = await request
    .json()
    .then((value: unknown) => value)
    .catch(() => null);
  if (body === null) {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const parsed = z.object({ archived: z.boolean() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "The archive state must be a boolean." },
      { status: 400 },
    );
  }

  try {
    const { collectionId } = await params;
    await setPortfolioCollectionArchived(
      getPortfolioDatabase(),
      collectionId,
      parsed.data.archived,
    );
    revalidatePath("/portfolio");
    revalidatePath("/models");
    revalidatePath("/styles");
    return NextResponse.json({ archived: parsed.data.archived });
  } catch (error) {
    console.error("portfolio_collection_archive_failed", error);
    return NextResponse.json(
      { message: "Unable to update the collection." },
      { status: 503 },
    );
  }
}
