import { Handler } from '@netlify/functions';

/**
 * Netlify Background Function to sync booking data to Booksy.
 * This simple implementation validates the incoming payload and logs it.
 * In a real environment it would forward the request to the Booksy API using the
 * secret defined in `BOOKSY_SYNC_SECRET`.
 */
export const handler: Handler = async (event, context) => {
  try {
    const payload = JSON.parse(event.body ?? '{}');
    const requiredFields = ['action', 'bookingId', 'startTime', 'endTime'];
    const missing = requiredFields.filter((f) => !(f in payload));
    if (missing.length) {
      console.error('Missing fields in Booksy sync payload:', missing);
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields', missing }) };
    }
    // Simple secret check (could be more robust)
    const authHeader = event.headers['authorization'] || '';
    const expected = process.env.BOOKSY_SYNC_SECRET ?? '';
    if (!authHeader.includes(expected)) {
      console.warn('Unauthorized Booksy sync attempt');
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    console.log('Received Booksy sync payload:', payload);
    // TODO: Forward to Booksy API here.
    return { statusCode: 202, body: JSON.stringify({ status: 'queued' }) };
  } catch (err) {
    console.error('Error in Booksy sync function:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
