/**
 * Test SSE streaming with proper message format
 */

const https = require('https');

// Test token (replace with a valid token from your database)
const token = 'e55bf6ed855767710b7e064cbde14e5db610600cc6b281884a29711f69c2a47d';
const prompt = '你好，请简单介绍一下你自己';

const url = `https://localhost:7002/ai/chat/stream?prompt=${encodeURIComponent(prompt)}`;

console.log('Testing SSE stream...');
console.log('URL:', url);
console.log('');

const options = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
  rejectUnauthorized: false, // Allow self-signed certificates
};

const req = https.get(url, options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('');

  let buffer = '';
  let chunkCount = 0;

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    
    // Process complete SSE messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.substring(5).trim();
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            chunkCount++;
            
            console.log(`[${chunkCount}] Type: ${parsed.type}, Content: "${parsed.content?.substring(0, 50)}${parsed.content?.length > 50 ? '...' : ''}"`);
            
            if (parsed.type === 'done' || parsed.type === 'error') {
              console.log('\nStream completed!');
              console.log('Total chunks:', chunkCount);
              process.exit(0);
            }
          } catch (error) {
            console.error('Failed to parse:', data);
          }
        }
      }
    }
  });

  res.on('end', () => {
    console.log('\nConnection closed');
    console.log('Total chunks received:', chunkCount);
  });

  res.on('error', (error) => {
    console.error('Response error:', error);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\nTest timeout');
  process.exit(1);
}, 30000);
