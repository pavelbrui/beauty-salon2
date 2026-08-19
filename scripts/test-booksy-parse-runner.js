const { parseBookingEmail } = require('./test-parse-compiled');
const fs = require('fs');
const path = require('path');

const sampleHtml = fs.readFileSync(path.join(__dirname, 'sample-email.html'), 'utf8');
const subject = '"Mariola Czerniawska" <no-reply@booksy.com>Mariola Czerniawska: nowa rezerwacja środa, 21 pazdziernika 2026 16:30';

const result = parseBookingEmail(subject, sampleHtml);
console.log('Parse result:', result);
