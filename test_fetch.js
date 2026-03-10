const http = require('http');
http.get('http://localhost:5175/src/utils/supabaseClient.js', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', data));
}).on('error', (err) => console.log('Error:', err.message));
