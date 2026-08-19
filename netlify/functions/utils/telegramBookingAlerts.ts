interface TelegramBookingAlert {
  source: 'site' | 'booksy-complex';
  bookingId: string;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  serviceName: string | null;
  startTime: string | null;
  endTime?: string | null;
  stylistName: string | null;
  priceText?: string | null;
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

const valueOrDash = (value: string | null | undefined): string => value?.trim() || '—';

function formatPolishDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';

  try {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function buildAlertText(alert: TelegramBookingAlert): string {
  const isSiteBooking = alert.source === 'site';
  const headline = isSiteBooking
    ? 'Nowa rezerwacja ze strony'
    : 'Nowa rezerwacja kompleksowa (Booksy)';
  const source = isSiteBooking ? 'nasza strona' : 'Booksy — rezerwacja kompleksowa';
  const dateRange = alert.endTime
    ? `${formatPolishDateTime(alert.startTime)}–${new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(alert.endTime))}`
    : formatPolishDateTime(alert.startTime);

  const lines = [
    headline,
    '',
    `Źródło: ${source}`,
    `Klient: ${valueOrDash(alert.clientName)}`,
    `Telefon: ${valueOrDash(alert.clientPhone)}`,
    `E-mail: ${valueOrDash(alert.clientEmail)}`,
    `Usługa: ${valueOrDash(alert.serviceName)}`,
    `Termin: ${dateRange}`,
    `Stylistka: ${valueOrDash(alert.stylistName)}`,
  ];

  if (alert.priceText?.trim()) lines.push(`Cena: ${alert.priceText.trim()}`);
  return lines.join('\n');
}

/**
 * Sends a notification only from the server. The bot token and target chat ID
 * are always read from deployment environment variables and never sent to the
 * browser or committed to the repository.
 */
export async function sendTelegramBookingAlert(alert: TelegramBookingAlert): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildAlertText(alert),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      console.error(`Telegram notification failed with HTTP ${response.status} for ${alert.source}:${alert.bookingId}`);
    }
  } catch (error) {
    console.error(`Telegram notification request failed for ${alert.source}:${alert.bookingId}`, error);
  }
}

export type { TelegramBookingAlert };
