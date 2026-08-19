// Minimal compiled helper exposing parseBookingEmail for local testing.
// This file contains a lightweight extraction of the parsing helpers needed.
const POLISH_MONTHS = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  wrzesnia: 8,
  września: 8,
  pazdziernika: 9,
  października: 9,
  listopada: 10,
  grudnia: 11,
};

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9ąćęłńóśźż]+/g, ' ')
    .trim();
}

const POLISH_MONTHS_NORMALIZED = {};
for (const k of Object.keys(POLISH_MONTHS)) POLISH_MONTHS_NORMALIZED[normalizeSearchText(k)] = POLISH_MONTHS[k];

function getPolandOffset(year, month, day) {
  const marchLast = new Date(year, 2, 31);
  const marchSunday = 31 - marchLast.getDay();
  const octLast = new Date(year, 9, 31);
  const octSunday = 31 - octLast.getDay();
  const dateNum = month * 100 + day;
  const summerStart = 2 * 100 + marchSunday;
  const summerEnd = 9 * 100 + octSunday;
  if (dateNum >= summerStart && dateNum < summerEnd) return '+02:00';
  return '+01:00';
}

function parsePolishDateTime(text) {
  const rangePattern = /(\d{1,2})\s+([^,\s]+)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/i;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch) {
    const day = parseInt(rangeMatch[1]);
    const monthRaw = rangeMatch[2];
    let month = POLISH_MONTHS[monthRaw.toLowerCase()];
    if (month === undefined) month = POLISH_MONTHS_NORMALIZED[normalizeSearchText(monthRaw)];
    if (month === undefined) return null;
    const year = parseInt(rangeMatch[3]);
    const startH = parseInt(rangeMatch[4]);
    const startM = parseInt(rangeMatch[5]);
    const endH = parseInt(rangeMatch[6]);
    const endM = parseInt(rangeMatch[7]);
    const offset = getPolandOffset(year, month, day);
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-${pad(day)}T${pad(startH)}:${pad(startM)}:00${offset}`;
    const end = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(endM)}:00${offset}`;
    return { start, end };
  }
  const singlePattern = /(\d{1,2})\s+([^,\s]+)\s+(\d{4}),?\s+(?:o godzinie\s+|godz\.?\s*)?(\d{1,2}):(\d{2})/i;
  const singleMatch = text.match(singlePattern);
  if (singleMatch) {
    const day = parseInt(singleMatch[1]);
    const monthRaw = singleMatch[2];
    let month = POLISH_MONTHS[monthRaw.toLowerCase()];
    if (month === undefined) month = POLISH_MONTHS_NORMALIZED[normalizeSearchText(monthRaw)];
    if (month === undefined) return null;
    const year = parseInt(singleMatch[3]);
    const h = parseInt(singleMatch[4]);
    const m = parseInt(singleMatch[5]);
    const offset = getPolandOffset(year, month, day);
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:00${offset}`;
    const endH = h + 1;
    const end = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(m)}:00${offset}`;
    return { start, end };
  }
  return null;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractNewBookingServiceName(text, html, clientName) {
  const normalizedText = text.replace(/\r/g, '\n');
  const lines = normalizedText
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  const serviceCandidates = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/\d[\d\s,.]*\s*zł/i.test(line)) continue;
    const inlineServiceMatch = line.match(/^(.*?)\s+\d[\d\s,.]*\s*zł/i);
    if (inlineServiceMatch?.[1]) serviceCandidates.push(inlineServiceMatch[1]);
    for (let prev = i - 1; prev >= 0; prev -= 1) {
      if (lines[prev]) {
        serviceCandidates.push(lines[prev]);
        break;
      }
    }
  }
  const htmlCandidates = Array.from(html.matchAll(/([^<>\n]{3,200}?)<br\s*\/?\s*>\s*[\d,.]+\s*zł/gi), (m) => m[1]);
  serviceCandidates.push(...htmlCandidates);
  const clean = (s) => s.replace(/\s*(?:,|\|)?\s*(?:pracownik|pracownica|stylista|stylistka|wykonawca|specjalista|employee|staff|worker)\s*[:\-].*$/i, '').trim();
  for (const c of serviceCandidates) {
    if (!c) continue;
    if (c.length < 3) continue;
    if (/\d/.test(c) && /zł/i.test(c)) continue;
    if (c.toLowerCase().includes(clientName && clientName.toLowerCase())) continue;
    return clean(c);
  }
  return '';
}

function extractClientNameFromSubject(cleanedSubject) {
  const regex = /^(.+?):\s*(?:nowa rezerwacja|zmieni(?:ł|l|ła|la)\s+rezerwacj(?:ę|e)|odwoła(?:ł|l|ła|la)\s+(?:swoj(?:ą|a)\s+usług(?:ę|e)|wizyt(?:ę|e)))/i;
  const m = cleanedSubject.match(regex);
  return m?.[1] ? m[1].trim() : '';
}

function extractWorkerName(text, html) {
  const m = text.match(/(?:pracownik|pracownica|stylista|stylistka|wykonawca|specjalista|employee|staff|worker)\s*[:\-]\s*([^\n<,;|]+)/i);
  if (m?.[1]) return m[1].trim().replace(/[.,;:!?]+$/, '');
  const fs = html.match(/\((?:[^)]*?(?:stylistka|stylista)\s+([^()]+))\)\s*:/i);
  if (fs?.[1]) return fs[1].trim();
  return undefined;
}

function parseBookingEmail(subject, html) {
  const text = stripHtml(html);
  const cleanedSubject = subject.replace(/^(?:Fwd?|FW)\s*:\s*/i, '').trim();
  let clientName = extractClientNameFromSubject(cleanedSubject);
  if (!clientName) {
    const boldMatch = html.match(/<b>([^<]+)<\/b>/);
    if (boldMatch) clientName = boldMatch[1].trim();
  }
  const phoneMatch = text.match(/((?:\+48\s?)?(?:\d[\s-]?){9})/);
  const clientPhone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : undefined;
  const allEmails = text.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
  const clientEmail = allEmails.find((e) => !e.includes('booksy.com') && !e.includes('icloud.com') && !e.includes('noreply'));
  const workerName = extractWorkerName(text, html);
  const serviceName = extractNewBookingServiceName(text, html, clientName);
  const priceMatch = text.match(/([\d,\.\s]+)\s*zł/);
  const priceText = priceMatch ? priceMatch[0].trim() : undefined;
  const dt = parsePolishDateTime(text) || parsePolishDateTime(cleanedSubject) || null;
  if (!dt || !clientName) return null;
  return {
    clientName,
    clientPhone,
    clientEmail,
    serviceName: serviceName || 'Booksy',
    workerName,
    priceText,
    startTime: dt.start,
    endTime: dt.end,
    emailType: 'new',
  };
}

module.exports = { parseBookingEmail };
