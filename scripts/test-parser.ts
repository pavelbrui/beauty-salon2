/**
 * Test the Booksy email parser against real email examples.
 * Run: npx tsx scripts/test-parser.ts
 */

// ---- Copy of parser functions from booksy-webhook.ts ----

const POLISH_MONTHS: Record<string, number> = {
  stycznia: 0, lutego: 1, marca: 2, kwietnia: 3, maja: 4, czerwca: 5,
  lipca: 6, sierpnia: 7, września: 8, października: 9, listopada: 10, grudnia: 11,
};

function getPolandOffset(year: number, month: number, day: number): string {
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

interface ParsedBooking {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceName: string;
  workerName?: string;
  priceText?: string;
  startTime: string;
  endTime: string;
  emailType: 'new' | 'changed' | 'cancelled';
  oldStartTime?: string;
  oldEndTime?: string;
}

function detectEmailType(subject: string, html: string): 'new' | 'changed' | 'cancelled' {
  if (subject.includes('odwołał swoją usługę') || html.includes('odwołał swoją usługę')) return 'cancelled';
  if (subject.includes('zmienił rezerwację') || html.includes('zmienił rezerwację') || html.includes('przesunął swoją wizytę')) return 'changed';
  return 'new';
}

function parsePolishDateTime(text: string): { start: string; end: string } | null {
  const rangePattern = /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/i;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch) {
    const day = parseInt(rangeMatch[1]);
    const month = POLISH_MONTHS[rangeMatch[2].toLowerCase()];
    const year = parseInt(rangeMatch[3]);
    const startH = parseInt(rangeMatch[4]);
    const startM = parseInt(rangeMatch[5]);
    const endH = parseInt(rangeMatch[6]);
    const endM = parseInt(rangeMatch[7]);
    const offset = getPolandOffset(year, month, day);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      start: `${year}-${pad(month + 1)}-${pad(day)}T${pad(startH)}:${pad(startM)}:00${offset}`,
      end: `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(endM)}:00${offset}`,
    };
  }

  const singlePattern = /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})\s+(?:o godzinie\s+)?(\d{1,2}):(\d{2})/i;
  const singleMatch = text.match(singlePattern);
  if (singleMatch) {
    const day = parseInt(singleMatch[1]);
    const month = POLISH_MONTHS[singleMatch[2].toLowerCase()];
    const year = parseInt(singleMatch[3]);
    const h = parseInt(singleMatch[4]);
    const m = parseInt(singleMatch[5]);
    const offset = getPolandOffset(year, month, day);
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:00${offset}`;
    const endH = h + 1;
    const end = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(m)}:00${offset}`;
    return { start, end };
  }

  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseBookingEmail(subject: string, html: string): ParsedBooking | null {
  const emailType = detectEmailType(subject, html);
  const text = stripHtml(html);

  let clientName = '';
  const cleanedSubject = subject.replace(/^(?:Fwd?|FW)\s*:\s*/i, '');
  const subjectNameMatch = cleanedSubject.match(/^(.+?):\s*(nowa rezerwacja|zmienił rezerwację)/);
  if (subjectNameMatch) {
    clientName = subjectNameMatch[1].trim();
  } else if (emailType === 'cancelled') {
    const cancelNameMatch = text.match(/Klient\s+(.+?)\s+odwołał/i);
    if (cancelNameMatch) clientName = cancelNameMatch[1].trim();
  }

  if (!clientName) {
    const boldMatch = html.match(/<strong>([^<]+)<\/strong>/);
    if (boldMatch) clientName = boldMatch[1].trim();
    if (!clientName) {
      const bMatch = html.match(/<b>([^<]+)<\/b>/);
      if (bMatch) clientName = bMatch[1].trim();
    }
  }

  const phoneMatch = text.match(/((?:\+48\s?)?(?:\d[\s-]?){9})/) || text.match(/([\d\s+()-]{9,})/);
  const clientPhone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : undefined;

  const allEmails = text.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
  const clientEmail = allEmails.find(
    (e) => !e.includes('booksy.com') && !e.includes('icloud.com') && !e.includes('noreply')
  );

  const workerMatch = text.match(/pracownik\s*:\s*(.+?)(?:\n|$)/i);
  const workerName = workerMatch ? workerMatch[1].trim() : undefined;

  let serviceName = '';
  if (emailType === 'cancelled') {
    const svcMatch = text.match(/odwołał swoją usługę\s+(.+?)\s+w dniu/i);
    if (svcMatch) serviceName = svcMatch[1].trim();
  } else if (emailType === 'changed') {
    const svcMatch = text.match(/przesunął swoją wizytę\s+(.+?)\s+z dnia/i);
    if (svcMatch) serviceName = svcMatch[1].trim();
  } else {
    const svcLineMatch = text.match(/(.+?)\n\s*[\d,.]+\s*zł/);
    if (svcLineMatch) {
      serviceName = svcLineMatch[1].trim();
      const cleanMatch = serviceName.match(/(?:.*?:\s*)?([^:]+)$/);
      if (cleanMatch) serviceName = cleanMatch[1].trim();
    }
  }

  const priceMatch = text.match(/([\d,.\s]+)\s*zł/);
  const priceText = priceMatch ? priceMatch[0].trim() : undefined;

  let startTime: string | undefined;
  let endTime: string | undefined;
  let oldStartTime: string | undefined;
  let oldEndTime: string | undefined;

  if (emailType === 'new') {
    const dateTime = parsePolishDateTime(text);
    if (dateTime) { startTime = dateTime.start; endTime = dateTime.end; }
  } else if (emailType === 'changed') {
    const oldMatch = text.match(/z dnia\s+\S+,\s*(.+?)(?:\s*na inny termin|$)/s);
    if (oldMatch) {
      const oldDt = parsePolishDateTime(oldMatch[1]);
      if (oldDt) { oldStartTime = oldDt.start; oldEndTime = oldDt.end; }
    }
    const newMatch = text.match(/Nowy termin wizyty[:\s]*\n?([\s\S]+?)(?:\n\n|$)/);
    if (newMatch) {
      const newDt = parsePolishDateTime(newMatch[1]);
      if (newDt) { startTime = newDt.start; endTime = newDt.end; }
    }
  } else if (emailType === 'cancelled') {
    const cancelDateMatch = text.match(/w dniu\s+\S+,\s*(.+)/i);
    if (cancelDateMatch) {
      const dt = parsePolishDateTime(cancelDateMatch[1]);
      if (dt) { startTime = dt.start; endTime = dt.end; }
    }
  }

  if (!startTime || !clientName) return null;

  if (!endTime) {
    const d = new Date(startTime);
    d.setHours(d.getHours() + 1);
    endTime = d.toISOString();
  }

  return { clientName, clientPhone, clientEmail, serviceName: serviceName || 'Booksy', workerName, priceText, startTime, endTime, emailType, oldStartTime, oldEndTime };
}

// ---- TEST DATA from screenshots ----

// EMAIL 1: Cancellation
const cancelSubject = 'Wiktoria Karpiej odwołał swoją usługę';
const cancelHtml = `
<div style="background: #teal; text-align: center;">
  <img src="booksy-logo.png" alt="booksy">
</div>
<div>
  <p>Klient <strong>Wiktoria Karpiej</strong> odwołał swoją usługę <strong>Lifting rzęs / laminacja rzęs + botox + farbowanie</strong> w dniu <strong>poniedziałek, 23 lutego 2026</strong> o godzinie <strong>15:45</strong> .</p>
  <p>Dzięki Booksy wiesz, że ten klient nie przyjdzie na pewno na umówioną wizytę i możesz w tym czasie obsłużyć innego klienta.</p>
  <div style="background: #f5f5f5; padding: 16px;">
    <strong>Wiktoria Karpiej</strong><br>
    660 638 066<br>
    <a href="mailto:wiktoria_karpiej@o2.pl">wiktoria_karpiej@o2.pl</a>
  </div>
</div>`;

// EMAIL 2: New booking
const newSubject = 'Wiktoria Karpiej: nowa rezerwacja';
const newHtml = `
<div style="background: #teal; text-align: center;">
  <img src="booksy-logo.png" alt="booksy">
</div>
<div>
  <p><strong>Wiktoria Karpiej: nowa rezerwacja</strong></p>
  <div style="background: #f5f5f5; padding: 16px;">
    <strong>Wiktoria Karpiej</strong><br>
    660 638 066<br>
    <a href="mailto:wiktoria_karpiej@o2.pl">wiktoria_karpiej@o2.pl</a>
  </div>
  <p>poniedziałek, 23 lutego 2026, 17:00 - 19:00</p>
  <table>
    <tr>
      <td><img src="stylist.jpg"></td>
      <td>Manicure (Top-stylistka Agnessa): Manicure hybrydowy<br>126,00 zł, 17:00 - 19:00<br>pracownik: Agnessa</td>
    </tr>
  </table>
</div>`;

// EMAIL 3: Changed booking (FORWARDED from iPhone)
const changedSubject = 'Fwd: Sylwia Żmiejko: zmienił rezerwację';
const changedHtml = `
<div>
  Отправлено с iPhone<br><br>
  Начало переадресованного сообщения:<br><br>
  От: Sylwia Żmiejko &lt;no-reply@booksy.com&gt;<br>
  Дата: 21 февраля 2026 г. в 07:03:05 GMT+1<br>
  Кому: KATARZYNA BRUI &lt;brui.katya@icloud.com&gt;<br>
  Тема: Sylwia Żmiejko: zmienił rezerwację<br>
  Ответ-Кому: sylwia.iwanicka51@gmail.com<br><br>
</div>
<div style="background: #teal; text-align: center;">
  <img src="booksy-logo.png" alt="booksy">
</div>
<div>
  <p><strong>Sylwia Żmiejko</strong> przesunął swoją wizytę Uzupełnienie 1-1:2 z dnia <strong>środa, 4 marca 2026 15:45</strong> na inny termin.</p>
  <p><strong>Nowy termin wizyty:</strong></p>
  <p><strong>piątek, 6 marca 2026, 10:00 - 11:30</strong></p>
  <div style="background: #f5f5f5; padding: 16px;">
    <strong>Sylwia Żmiejko</strong><br>
    509 591 136<br>
    <a href="mailto:sylwia.iwanicka51@gmail.com">sylwia.iwanicka51@gmail.com</a>
  </div>
</div>`;

// Also test: auto-forwarded version (no Fwd: prefix, from is booksy)
const changedSubjectAutoFwd = 'Sylwia Żmiejko: zmienił rezerwację';
const changedHtmlAutoFwd = `
<div style="background: #teal; text-align: center;">
  <img src="booksy-logo.png" alt="booksy">
</div>
<div>
  <p><strong>Sylwia Żmiejko</strong> przesunął swoją wizytę Uzupełnienie 1-1:2 z dnia <strong>środa, 4 marca 2026 15:45</strong> na inny termin.</p>
  <p><strong>Nowy termin wizyty:</strong></p>
  <p><strong>piątek, 6 marca 2026, 10:00 - 11:30</strong></p>
  <div style="background: #f5f5f5; padding: 16px;">
    <strong>Sylwia Żmiejko</strong><br>
    509 591 136<br>
    <a href="mailto:sylwia.iwanicka51@gmail.com">sylwia.iwanicka51@gmail.com</a>
  </div>
</div>`;

// ---- RUN TESTS ----

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  FAIL: ${name}`);
    console.log(`        ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Test sender check
function checkFrom(from: string): boolean {
  return from.toLowerCase().includes('booksy');
}

console.log('\n=== SENDER CHECK ===');
test('Direct booksy email passes', () => assert(checkFrom('no-reply@booksy.com'), 'should pass'));
test('Booksy with name passes', () => assert(checkFrom('"Booksy" <no-reply@booksy.com>'), 'should pass'));
test('Forwarded from user FAILS', () => assert(!checkFrom('brui.katya@icloud.com'), 'should fail'));
test('Forwarded from iPhone FAILS', () => assert(!checkFrom('"Ekaterina Brui" <brui.katya@icloud.com>'), 'should fail'));

console.log('\n=== EMAIL 1: CANCELLATION ===');
// Debug: show what the parser sees
const cancelText = stripHtml(cancelHtml);
console.log('  --- Stripped text ---');
console.log(cancelText);
console.log('  --- End stripped text ---');
// Debug: check regex matches
const cancelTypeDbg = detectEmailType(cancelSubject, cancelHtml);
console.log('  detectEmailType:', cancelTypeDbg);
const cancelNameDbg = cancelText.match(/Klient\s+(.+?)\s+odwołał/i);
console.log('  cancelNameMatch:', cancelNameDbg?.[1]);
const cancelDateDbg = cancelText.match(/w dniu\s+\w+,\s*(.+)/i);
console.log('  cancelDateMatch:', cancelDateDbg?.[1]);
if (cancelDateDbg) {
  const dtDbg = parsePolishDateTime(cancelDateDbg[1]);
  console.log('  parsePolishDateTime:', dtDbg);
}
const cancel = parseBookingEmail(cancelSubject, cancelHtml);
console.log('  Result:', JSON.stringify(cancel, null, 2));
test('Parsed successfully', () => assert(cancel !== null, 'should not be null'));
test('Email type = cancelled', () => assert(cancel!.emailType === 'cancelled', `got: ${cancel!.emailType}`));
test('Client name = Wiktoria Karpiej', () => assert(cancel!.clientName === 'Wiktoria Karpiej', `got: "${cancel!.clientName}"`));
test('Phone = 660 638 066', () => assert(cancel!.clientPhone?.includes('660') === true, `got: "${cancel!.clientPhone}"`));
test('Email = wiktoria_karpiej@o2.pl', () => assert(cancel!.clientEmail === 'wiktoria_karpiej@o2.pl', `got: "${cancel!.clientEmail}"`));
test('Service includes "Lifting rzęs"', () => assert(cancel!.serviceName.includes('Lifting rzęs'), `got: "${cancel!.serviceName}"`));
test('Start time = 2026-02-23T15:45', () => assert(cancel!.startTime.includes('2026-02-23T15:45'), `got: "${cancel!.startTime}"`));

console.log('\n=== EMAIL 2: NEW BOOKING ===');
const newBooking = parseBookingEmail(newSubject, newHtml);
console.log('  Result:', JSON.stringify(newBooking, null, 2));
test('Parsed successfully', () => assert(newBooking !== null, 'should not be null'));
test('Email type = new', () => assert(newBooking!.emailType === 'new', `got: ${newBooking!.emailType}`));
test('Client name = Wiktoria Karpiej', () => assert(newBooking!.clientName === 'Wiktoria Karpiej', `got: "${newBooking!.clientName}"`));
test('Phone = 660 638 066', () => assert(newBooking!.clientPhone?.includes('660') === true, `got: "${newBooking!.clientPhone}"`));
test('Email = wiktoria_karpiej@o2.pl', () => assert(newBooking!.clientEmail === 'wiktoria_karpiej@o2.pl', `got: "${newBooking!.clientEmail}"`));
test('Service = Manicure hybrydowy', () => assert(newBooking!.serviceName === 'Manicure hybrydowy', `got: "${newBooking!.serviceName}"`));
test('Worker = Agnessa', () => assert(newBooking!.workerName === 'Agnessa', `got: "${newBooking!.workerName}"`));
test('Price includes "126"', () => assert(newBooking!.priceText?.includes('126') === true, `got: "${newBooking!.priceText}"`));
test('Start = 2026-02-23T17:00', () => assert(newBooking!.startTime.includes('2026-02-23T17:00'), `got: "${newBooking!.startTime}"`));
test('End = 2026-02-23T19:00', () => assert(newBooking!.endTime.includes('2026-02-23T19:00'), `got: "${newBooking!.endTime}"`));

console.log('\n=== EMAIL 3a: CHANGED (manual forward with Fwd:) ===');
const changed = parseBookingEmail(changedSubject, changedHtml);
console.log('  Result:', JSON.stringify(changed, null, 2));
test('Parsed successfully', () => assert(changed !== null, 'should not be null'));
test('Email type = changed', () => assert(changed!.emailType === 'changed', `got: ${changed!.emailType}`));
test('Client name = Sylwia Żmiejko (no Fwd:)', () => assert(changed!.clientName === 'Sylwia Żmiejko', `got: "${changed!.clientName}"`));
test('Phone = 509 591 136', () => assert(changed!.clientPhone?.includes('509') === true, `got: "${changed!.clientPhone}"`));
test('Email = sylwia.iwanicka51@gmail.com', () => assert(changed!.clientEmail === 'sylwia.iwanicka51@gmail.com', `got: "${changed!.clientEmail}"`));
test('Service = Uzupełnienie 1-1:2', () => assert(changed!.serviceName === 'Uzupełnienie 1-1:2', `got: "${changed!.serviceName}"`));
test('Old start = 2026-03-04T15:45', () => assert(changed!.oldStartTime?.includes('2026-03-04T15:45') === true, `got: "${changed!.oldStartTime}"`));
test('New start = 2026-03-06T10:00', () => assert(changed!.startTime.includes('2026-03-06T10:00'), `got: "${changed!.startTime}"`));
test('New end = 2026-03-06T11:30', () => assert(changed!.endTime.includes('2026-03-06T11:30'), `got: "${changed!.endTime}"`));

console.log('\n=== EMAIL 3b: CHANGED (auto-forward, clean) ===');
const changedAuto = parseBookingEmail(changedSubjectAutoFwd, changedHtmlAutoFwd);
console.log('  Result:', JSON.stringify(changedAuto, null, 2));
test('Parsed successfully', () => assert(changedAuto !== null, 'should not be null'));
test('Client name = Sylwia Żmiejko', () => assert(changedAuto!.clientName === 'Sylwia Żmiejko', `got: "${changedAuto!.clientName}"`));
test('Email = sylwia.iwanicka51@gmail.com', () => assert(changedAuto!.clientEmail === 'sylwia.iwanicka51@gmail.com', `got: "${changedAuto!.clientEmail}"`));

console.log('\n=== SUMMARY ===');
