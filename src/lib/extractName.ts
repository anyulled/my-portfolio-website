export const extractNameFromTag = (
  data: Array<{ tag: string; name: string }>,
  targetName: string,
): string | undefined => data.find((model) => model.tag === targetName)?.name;
