type VerificationInput = {
  name: string;
  nicNumber: string;
  identityCardImage?: string;
  ocrText?: string;
};

type VerificationResult = {
  valid: boolean;
  reason?: string;
  ocrText?: string;
};

/**
 * Validate Sri Lankan NIC format
 * SL NIC format: YYXXXSSSNNNN
 * YY: Year of birth (00-99)
 * XXX: Day of year (001-366)
 * S: Gender district (or other digit)
 * NNNN: Serial number
 */
function isValidSlNicDayValue(dayValue: number): boolean {
  // Male: 001-366, Female: 501-866
  return (dayValue >= 1 && dayValue <= 366) || (dayValue >= 501 && dayValue <= 866);
}

function isValidSLNicFormat(nic: string): boolean {
  const cleaned = nic.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();

  // New format: YYYYDDDSSSS (12 digits)
  if (/^\d{12}$/.test(cleaned)) {
    const dayPart = parseInt(cleaned.substring(4, 7), 10);
    return isValidSlNicDayValue(dayPart);
  }

  // Old format: YYDDDSSSSV or YYDDDSSSSX
  if (/^\d{9}[VX]$/.test(cleaned)) {
    const dayPart = parseInt(cleaned.substring(2, 5), 10);
    return isValidSlNicDayValue(dayPart);
  }

  return false;
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNic(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function normalizeOcrDigits(value: string): string {
  return value
    .toUpperCase()
    .replace(/[O]/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[^A-Z0-9]/g, '');
}

function extractSlNicCandidatesFromOcr(rawText: string): string[] {
  const candidates = new Set<string>();

  // Prefer sequences near common ID labels such as No / NIC / ID.
  const labeledPattern = /(no\.?|nic|id)\s*[:\-]?\s*([0-9A-Za-z\s\-]{9,24})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledPattern.exec(rawText)) !== null) {
    const normalized = normalizeOcrDigits(labeledMatch[2] || '');
    if (isValidSLNicFormat(normalized)) {
      candidates.add(normalized);
    }
  }

  // Fallback: tokenize OCR text and test each token (avoids accidental cross-line concatenation).
  const tokenPattern = /[0-9A-Za-z\-]{6,20}/g;
  const rawTokens = rawText.match(tokenPattern) || [];
  for (const token of rawTokens) {
    const normalized = normalizeOcrDigits(token);
    if (isValidSLNicFormat(normalized)) {
      candidates.add(normalized);
    }
  }

  return Array.from(candidates);
}

/**
 * Enhanced name matching for Sri Lankan names
 * Handles multi-part names, initials, and variable word order
 */
function nameMatches(ocrText: string, inputName: string): boolean {
  const normalizedOcr = normalizeForMatch(ocrText);
  const normalizedInput = normalizeForMatch(inputName);
  
  // Direct substring match (most reliable)
  if (normalizedOcr.includes(normalizedInput)) {
    return true;
  }
  
  // Reverse - check if input contains OCR text
  if (normalizedInput.includes(normalizedOcr)) {
    return true;
  }
  
  // Split into tokens for partial matching
  const inputTokens = normalizedInput
    .split(' ')
    .filter((token) => token.length >= 2);
  
  const ocrTokens = normalizedOcr
    .split(' ')
    .filter((token) => token.length >= 2);

  if (inputTokens.length === 0 || ocrTokens.length === 0) {
    return false;
  }

  // For single-word matches, require exact match
  if (inputTokens.length === 1 && ocrTokens.length === 1) {
    return inputTokens[0] === ocrTokens[0];
  }

  // Count how many input tokens appear in OCR tokens
  const matchedTokens = inputTokens.filter((inputToken) => 
    ocrTokens.some(ocrToken => 
      ocrToken.includes(inputToken) || inputToken.includes(ocrToken)
    )
  ).length;

  // For multi-word names:
  // - If input has 2+ words, require at least 2 tokens to match
  // - If input has 1 word, require that word to appear in OCR
  if (inputTokens.length >= 2) {
    return matchedTokens >= 2;
  }

  // Single input word case: must appear in OCR
  return matchedTokens >= 1;
}

/**
 * Extract potential names from OCR text
 * SL ID cards typically have the name in the upper portion, often prefixed with "Name:"
 */
function extractNamesFromOcr(ocrText: string): string[] {
  const lines = ocrText.split('\n');
  const names: string[] = [];
  
  // Look for lines with "Name:" prefix (common in ID cards)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Extract text after "Name:" keyword
    const nameMatch = trimmed.match(/name\s*:?\s*(.+)/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim();
      if (extractedName.length > 2) {
        names.push(extractedName);
      }
    }
  }
  
  // If no name found with keyword, look for lines with primarily letters
  if (names.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Keep likely English name lines with enough letters.
      const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
      const digitCount = (trimmed.match(/\d/g) || []).length;
      const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;

      if (letterCount > digitCount + specialCharCount && trimmed.length >= 3) {
        names.push(trimmed);
      }
    }
  }
  
  return names;
}

export async function verifyIdCardDetails(input: VerificationInput): Promise<VerificationResult> {
  const name = String(input.name || '').trim();
  const nic = normalizeNic(input.nicNumber || '');
  const ocrText = String(input.ocrText || '').trim();

  if (!name || !nic) {
    return {
      valid: false,
      reason: 'Name and NIC number are required for verification.',
    };
  }

  // Validate NIC format before comparison.
  if (!isValidSLNicFormat(nic)) {
    return {
      valid: false,
      reason: 'Please enter a valid Sri Lankan NIC number (new or old format).',
    };
  }

  if (!ocrText) {
    return {
      valid: false,
      reason: 'Could not read text from the identity card image. Please upload a clearer image.',
    };
  }

  try {
    const rawText = ocrText;
    const nicNoSpaces = nic.replace(/\s+/g, '');
    const normalizedNicForOcr = normalizeOcrDigits(nicNoSpaces);

    if (!rawText.trim()) {
      return {
        valid: false,
        reason: 'Could not read text from the identity card image. Please upload a clearer image.',
      };
    }

    // Extract valid SL NIC candidates from OCR and require exact equality.
    const nicCandidates = extractSlNicCandidatesFromOcr(rawText);
    const nicInCard = nicCandidates.includes(normalizedNicForOcr);

    // Compare entered name against extracted full text and likely name lines.
    const extractedNames = extractNamesFromOcr(rawText);
    const nameInCard = extractedNames.some(extractedName => 
      nameMatches(extractedName, name)
    ) || nameMatches(rawText, name);

    // Return detailed mismatch information
    if (!nameInCard && !nicInCard) {
      return {
        valid: false,
        reason: "Name and NIC number don't match the uploaded ID card.",
        ocrText: rawText.slice(0, 2000),
      };
    }

    if (!nameInCard) {
      return {
        valid: false,
        reason: "Name doesn't match the uploaded ID card.",
        ocrText: rawText.slice(0, 2000),
      };
    }

    if (!nicInCard) {
      return {
        valid: false,
        reason: "NIC doesn't match the uploaded ID card.",
        ocrText: rawText.slice(0, 2000),
      };
    }

    return { valid: true, ocrText: rawText.slice(0, 2000) };
  } catch {
    return {
      valid: false,
      reason: 'Failed to scan identity card image. Please upload a valid and clear image.',
    };
  }
}
