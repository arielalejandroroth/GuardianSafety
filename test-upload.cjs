const http = require('http');

const generateString = (char, length) => Array.from({length}).map(() => char).join('');
const fakeBase64 = generateString('A', 150000); // 150KB fake image

const optionsUpload = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload-chunk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const reqUpload = http.request(optionsUpload, (res) => {
  res.setEncoding('utf8');
  let data = "";
  res.on('data', (c) => data += c);
  res.on('end', () => {
    console.log(`UPLOAD RESULT: ${data}`);
    const tempPath = JSON.parse(data).tempPath;
    
    // Now call gemini
    const payload = JSON.stringify({
      action: "generateRiskMap",
      payload: {
        tempFilePath: tempPath,
        mimeType: "image/jpeg",
        sector: "Garage",
        prompt: "Identify risks"
      }
    });

    const reqCmd = http.request({
      hostname: 'localhost', port: 3000, path: '/api/gemini', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
    }, (res2) => {
      console.log(`API STATUS: ${res2.statusCode}`);
      let apiData = "";
      res2.on('data', c => apiData += c);
      res2.on('end', () => console.log(`API RESULT: ${apiData}`));
    });
    reqCmd.write(payload);
    reqCmd.end();
  });
});

reqUpload.write(JSON.stringify({
  sessionId: "test",
  chunkIndex: 0,
  totalChunks: 1,
  chunkData: fakeBase64
}));
reqUpload.end();
