const fs = require('fs');
const https = require('https');
const path = require('path');

const screens = [
  { name: 'ScanOptions', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzhhMGIxMTVjYzIyMzRlZjE5NWU0YmYxZDVlOGZjMzhmEgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' },
  { name: 'AttendanceScanner', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWZkNzRlZjIyODMwMzgzOGVkYmQ5MGZlMmI1EgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' },
  { name: 'Registration', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRjNDI1YWI4MmU5YTRjMjlhYmJkNjk1NTYzYTQ4M2FmEgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' },
  { name: 'Home', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzg0MzgxNmRmYWI4NTQyZDdiNmY3ZjA5MWEwZGQ1NTFmEgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' },
  { name: 'Login', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzMzNjA5NGE4NGMwMTRmYzdhM2E4YzU0MTBlYjUwNTA4EgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' },
  { name: 'RemarkSearch', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzJiMTEyZWFiNGQ3YzRhOGZiOTRhZDkwY2I3YzUxMDcyEgsSBxDwzKmj7RYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg4ODEyOTkzNTQ3NzExMzAxMQ&filename=&opi=89354086' }
];

const dir = path.join(__dirname, 'stitch_screens');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

screens.forEach(screen => {
  https.get(screen.url, (res) => {
    const filePath = path.join(dir, `${screen.name}.html`);
    const writeStream = fs.createWriteStream(filePath);
    res.pipe(writeStream);
    writeStream.on('finish', () => {
      writeStream.close();
      console.log(`Downloaded ${screen.name}.html`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${screen.name}: ${err.message}`);
  });
});
