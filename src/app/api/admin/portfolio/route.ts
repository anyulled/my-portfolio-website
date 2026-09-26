import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  deletePortfolioPhotoObjects,
  uploadDriveImages,
} from "@/services/portfolio/images";
import {
  createPortfolioModels,
  deleteUnusedPortfolioModels,
  getCollectionPhotoPaths,
  getPortfolioDatabase,
  listPortfolioCollections,
  listPortfolioModels,
  savePortfolioCollection,
} from "@/services/portfolio/repository";
import { collectionDraftSchema } from "@/services/portfolio/validation";
import { slugifyPortfolioName } from "@/lib/portfolio";
import { connection, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const unauthorizedResponse = () =>
  NextResponse.json(
    { message: "An authorized operator session is required." },
    { status: 401 },
  );

const saveWithCleanup = async (
  database: ReturnType<typeof getPortfolioDatabase>,
  draft: Awaited<ReturnType<typeof collectionDraftSchema.parseAsync>>,
  collectionId: string,
  newModels: Array<{ name: string; slug: string; profileUrl: string }>,
) => {
  const stagedPhotos = await uploadDriveImages(collectionId, draft.driveImages);
  const createdModels = await createPortfolioModels(database, newModels);
  try {
    const modelIds = [
      ...new Set([
        ...draft.modelIds,
        ...createdModels.map((model) => model.id),
      ]),
    ];
    return await savePortfolioCollection(
      database,
      { ...draft, id: collectionId },
      modelIds.map((id) => ({ id })),
      stagedPhotos,
    );
  } catch (error) {
    await deletePortfolioPhotoObjects(
      stagedPhotos.map((photo) => photo.objectPath),
    );
    await deleteUnusedPortfolioModels(
      database,
      createdModels.map((model) => model.id),
    );
    throw error;
  }
};

export async function GET() {
  await connection();
  if (!(await getAuthenticatedOperator())) {
    return unauthorizedResponse();
  }
  if (isHarnessFixtureMode()) {
    return NextResponse.json({ collections: [], models: [] });
  }

  try {
    const database = getPortfolioDatabase();
    const [collections, models] = await Promise.all([
      listPortfolioCollections(database, { includeArchived: true }),
      listPortfolioModels(database),
    ]);
    return NextResponse.json({ collections, models });
  } catch (error) {
    console.error("portfolio_admin_load_failed", error);
    return NextResponse.json(
      { message: "Unable to load portfolio collections." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  await connection();
  if (!(await getAuthenticatedOperator())) {
    return unauthorizedResponse();
  }
  if (isHarnessFixtureMode()) {
    return NextResponse.json(
      { message: "Portfolio editing is unavailable in fixture mode." },
      { status: 503 },
    );
  }

  const requestBody = (await request.json().catch(() => null)) as unknown;
  if (requestBody === null) {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const parsed = collectionDraftSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "The collection details are invalid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const draft = parsed.data;
  const newModels = draft.newModels.map((model) => ({
    ...model,
    slug: slugifyPortfolioName(model.name),
  }));
  if (newModels.some((model) => !model.slug)) {
    return NextResponse.json(
      { message: "Each model name must produce a valid URL slug." },
      { status: 400 },
    );
  }
  if (new Set(newModels.map((model) => model.slug)).size !== newModels.length) {
    return NextResponse.json(
      { message: "New model names must have unique URL slugs." },
      { status: 400 },
    );
  }

  const database = getPortfolioDatabase();
  const collectionId = draft.id ?? crypto.randomUUID();
  try {
    const previousObjectPaths = draft.id
      ? await getCollectionPhotoPaths(database, draft.id)
      : [];
    const savedCollectionId = await saveWithCleanup(
      database,
      draft,
      collectionId,
      newModels,
    );
    await deletePortfolioPhotoObjects(previousObjectPaths);
    revalidatePath("/portfolio");
    revalidatePath("/models");
    revalidatePath("/styles");
    return NextResponse.json({ collectionId: savedCollectionId });
  } catch (error) {
    console.error("portfolio_collection_save_failed", error);
    return NextResponse.json(
      {
        message:
          "Unable to publish the collection. The previous version is unchanged.",
      },
      { status: 503 },
    );
  }
}
