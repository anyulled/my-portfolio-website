import {Model} from "@/data/models";

export const extractNameFromTag = (
  data: Array<Model>,
  targetName: string,
): string | undefined => data.find((model) => model.tag === targetName)?.name;
