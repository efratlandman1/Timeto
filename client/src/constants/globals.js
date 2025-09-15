// רשימת קידומות טלפון בישראל
export const PHONE_PREFIXES = [
  '050', '052', '053', '054', '055', '057', '058',
  '02', '03', '04', '08', '09',
  '072', '073', '074', '076',
].sort((a, b) => Number(a) - Number(b));

// אורך מקסימלי של מספר טלפון בישראל
export const PHONE_NUMBER_MAX_LENGTH = 7;
