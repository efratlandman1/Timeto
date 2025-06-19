export function buildQueryUrl(baseUrl, params = {}, location) {
    console.log("baseUrl:",baseUrl);
    console.log("params:",params);
    console.log("location:",location);
  const url = new URL(baseUrl, window.location.origin);

  // הוספת פרמטרים רגילים (תמיכה במערכים)
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.append(key, v);
        }
      });
    } else if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  // הוספת מיקום אם קיים (כולל ערך 0)
  if (
    location &&
    location.lat !== undefined &&
    location.lng !== undefined
  ) {
    url.searchParams.append('lat', location.lat);
    url.searchParams.append('lng', location.lng);
  }
  console.log("url:", url.toString());
  return url.toString();
} 