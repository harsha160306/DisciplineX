export function getCurrentBaseYear() {
  const now = new Date();
  const year = now.getFullYear();
  // Assume the new academic year starts in June (month index 5)
  const month = now.getMonth(); 
  return month >= 5 ? year : year - 1;
}

export function generateActiveBatches() {
  const baseYear = getCurrentBaseYear();
  // Generate batches for the 4 active years
  return [
    { label: `1st Year (${baseYear}-${baseYear + 1})`, value: `${baseYear} - ${baseYear + 1}`, filterValue: '1st Year' },
    { label: `2nd Year (${baseYear - 1}-${baseYear})`, value: `${baseYear - 1} - ${baseYear}`, filterValue: '2nd Year' },
    { label: `3rd Year (${baseYear - 2}-${baseYear - 1})`, value: `${baseYear - 2} - ${baseYear - 1}`, filterValue: '3rd Year' },
    { label: `4th Year (${baseYear - 3}-${baseYear - 2})`, value: `${baseYear - 3} - ${baseYear - 2}`, filterValue: '4th Year' },
  ];
}

export function getCalculatedYear(batchString) {
  if (!batchString) return 'Unknown Year';
  
  // Handle legacy literal strings safely (e.g. if DB has "1st Year")
  if (batchString.toLowerCase().includes('year')) {
    // Attempt to normalize
    if (batchString.includes('1st')) return '1st Year';
    if (batchString.includes('2nd')) return '2nd Year';
    if (batchString.includes('3rd')) return '3rd Year';
    if (batchString.includes('4th')) return '4th Year';
    return batchString; 
  }

  // Extract the starting year (e.g., "2023" from "2023 - 2024" or "2023-2027")
  const match = batchString.match(/^(\d{4})/);
  if (!match) return batchString;

  const enrollmentYear = parseInt(match[1], 10);
  const currentBaseYear = getCurrentBaseYear();
  
  const diff = currentBaseYear - enrollmentYear;
  
  if (diff === 0) return '1st Year';
  if (diff === 1) return '2nd Year';
  if (diff === 2) return '3rd Year';
  if (diff === 3) return '4th Year';
  
  if (diff < 0) return 'Incoming';
  return 'Alumni'; // diff > 3
}

export function getBatchFromYearLabel(yearLabel) {
  // Useful for backward-compatible filtering 
  // e.g., mapping a dropdown option "1st Year" to the corresponding batch string "2026 - 2027"
  const batches = generateActiveBatches();
  const found = batches.find(b => b.filterValue === yearLabel || b.label === yearLabel);
  return found ? found.value : yearLabel;
}
