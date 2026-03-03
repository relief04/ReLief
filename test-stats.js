fetch('http://localhost:3000/api/admin/stats')
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);
