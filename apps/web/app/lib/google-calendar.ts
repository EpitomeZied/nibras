type CalendarEventInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  url?: string;
  host?: string;
};

function toGoogleDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z/, 'Z');
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const dates = `${toGoogleDate(event.startsAt)}/${toGoogleDate(event.endsAt)}`;
  const details = [
    event.host ? `Platform: ${event.host}` : null,
    event.url ? `Contest: ${event.url}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates,
  });
  if (details) params.set('details', details);
  if (event.url) params.set('location', event.url);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
