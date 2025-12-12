export function fixYoastUrls(value) {
  if (!value) return value;
  return value.replace(/https:\/\/furssati\.io/gi, "https://fursatiuniforms.com");
}
