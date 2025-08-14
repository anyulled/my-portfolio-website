import { Model } from "@/data/models";
import { Style } from "@/data/styles";

export const extractNameFromTag = (
  data: Array<Model> | Array<Style>,
  targetName: string,
): string | undefined =>
  data.find((element) => element.tag === targetName)?.name;
