fetch('http://localhost:5000/api/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ system_announcement_message: 'hello' })
}).then(r => r.json().then(j => console.log(r.status, j))).catch(console.error);
