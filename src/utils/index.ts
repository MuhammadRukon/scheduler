export function formatText(text: string, separator: string = "-") {
  return text.toLowerCase().split(" ").join(separator) || "";
}
