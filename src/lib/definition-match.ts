function normalizeDefinition(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, "")
    .replace(/[-/]/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function damerauLevenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const distance = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );

  for (let i = 0; i <= a.length; i++) distance[i][0] = i;
  for (let j = 0; j <= b.length; j++) distance[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance[i][j] = Math.min(
          distance[i][j],
          distance[i - 2][j - 2] + cost,
        );
      }
    }
  }

  return distance[a.length][b.length];
}

function allowedStrictTypoDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 10) return 2;
  return Math.min(3, Math.floor(length * 0.15));
}

function isStrictTypoDefinitionMatch(
  input: string,
  definition: string,
): boolean {
  const normalizedInput = normalizeDefinition(input);
  const normalizedDefinition = normalizeDefinition(definition);
  const maxLength = Math.max(
    normalizedInput.length,
    normalizedDefinition.length,
  );
  const maxDistance = allowedStrictTypoDistance(maxLength);

  if (maxLength === 0) return false;
  if (
    Math.abs(normalizedInput.length - normalizedDefinition.length) > maxDistance
  )
    return false;

  const distance = damerauLevenshteinDistance(
    normalizedInput,
    normalizedDefinition,
  );
  if (distance <= maxDistance && distance / maxLength <= 0.18) {
    return true;
  }

  const compactInput = normalizedInput.replace(/\s/g, "");
  const compactDefinition = normalizedDefinition.replace(/\s/g, "");
  const compactMaxLength = Math.max(
    compactInput.length,
    compactDefinition.length,
  );
  const compactMaxDistance = allowedStrictTypoDistance(compactMaxLength);

  if (compactInput === compactDefinition) return true;
  if (
    Math.abs(compactInput.length - compactDefinition.length) >
    compactMaxDistance
  )
    return false;

  const compactDistance = damerauLevenshteinDistance(
    compactInput,
    compactDefinition,
  );

  return (
    compactMaxLength > 0 &&
    compactDistance <= compactMaxDistance &&
    compactDistance / compactMaxLength <= 0.15
  );
}

function getDefinitionTokens(value: string): string[] {
  const normalized = normalizeDefinition(value);
  if (normalized === "") return [];
  return normalized.split(" ");
}

function tokenMatches(inputToken: string, definitionToken: string): boolean {
  if (inputToken === definitionToken) return true;

  const maxLength = Math.max(inputToken.length, definitionToken.length);
  if (maxLength < 5) return false;
  if (Math.abs(inputToken.length - definitionToken.length) > 1) return false;

  return damerauLevenshteinDistance(inputToken, definitionToken) <= 1;
}

function isTokenPhraseDefinitionMatch(
  input: string,
  definition: string,
): boolean {
  const inputTokens = getDefinitionTokens(input);
  const definitionTokens = getDefinitionTokens(definition);

  if (inputTokens.length < 2 && definitionTokens.length < 2) return false;
  if (Math.abs(inputTokens.length - definitionTokens.length) > 1) return false;

  const compactInput = inputTokens.join("");
  const compactDefinition = definitionTokens.join("");
  if (compactInput !== "" && compactInput === compactDefinition) return true;

  const unmatchedDefinitionTokens = [...definitionTokens];
  let matches = 0;

  for (const inputToken of inputTokens) {
    const matchIndex = unmatchedDefinitionTokens.findIndex((definitionToken) =>
      tokenMatches(inputToken, definitionToken),
    );

    if (matchIndex >= 0) {
      matches += 1;
      unmatchedDefinitionTokens.splice(matchIndex, 1);
    }
  }

  return matches / Math.max(inputTokens.length, definitionTokens.length) >= 0.8;
}

export function isExactDefinitionMatch(
  input: string,
  definitions: string[],
): boolean {
  const normalized = normalizeDefinition(input);
  return definitions.some(
    (definition) => normalizeDefinition(definition) === normalized,
  );
}

export function isLocallyAcceptableDefinition(
  input: string,
  definitions: string[],
): boolean {
  return definitions.some(
    (definition) =>
      isStrictTypoDefinitionMatch(input, definition) ||
      isTokenPhraseDefinitionMatch(input, definition),
  );
}
