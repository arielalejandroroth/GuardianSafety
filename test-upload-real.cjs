const http = require('http');

const base64Img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="; // standard 1x1 png

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
    
    const payload = JSON.stringify({
      action: "generateRiskMap",
      payload: {
        tempFilePath: tempPath,
        mimeType: "image/png",
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
  sessionId: "test-real",
  chunkIndex: 0,
  totalChunks: 1,
  chunkData: base64Img
}));
reqUpload.end();
