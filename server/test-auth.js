const http = require('http');

const runTest = (path, body, title) => {
    return new Promise((resolve) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                console.log(`\n--- ${title} ---`);
                console.log(`Status Code: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', e => {
            console.error(`\n--- ${title} ---`);
            console.error(`Problem with request: ${e.message}`);
            resolve(500);
        });

        req.write(payload);
        req.end();
    });
};

async function testAll() {
    const ts = Date.now();
    const email = `testuser${ts}@test.com`;
    const password = 'securepassword123';

    await runTest('/api/auth/register', { name: "Test User", email, password }, "REGISTER TEST");
    await runTest('/api/auth/login', { email, password }, "LOGIN TEST");

    process.exit();
}

testAll();
