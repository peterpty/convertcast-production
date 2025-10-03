// Direct auth test without browser
const https = require('https');

const data = JSON.stringify({
  email: 'petertillmanyoung@gmail.com',
  password: process.env.TEST_PASSWORD || 'your-password-here'
});

const options = {
  hostname: 'yedvdwedhoetxukablxf.supabase.co',
  port: 443,
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTg5NjIsImV4cCI6MjA3MzYzNDk2Mn0.fu2tFf_C56nrO6fZgBfG2eqXkIEKW739fv0u6MqU1nc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTg5NjIsImV4cCI6MjA3MzYzNDk2Mn0.fu2tFf_C56nrO6fZgBfG2eqXkIEKW739fv0u6MqU1nc'
  }
};

console.log('🔐 Testing Supabase Auth Directly...');
console.log('Email:', 'petertillmanyoung@gmail.com');
console.log('Endpoint:', `https://${options.hostname}${options.path}`);
console.log('');

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
  console.log('');

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));

      if (parsed.access_token) {
        console.log('\n✅ Authentication successful!');
        console.log('Access token received:', parsed.access_token.substring(0, 50) + '...');
      } else if (parsed.error) {
        console.log('\n❌ Authentication failed!');
        console.log('Error:', parsed.error);
        console.log('Description:', parsed.error_description || 'No description');
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
