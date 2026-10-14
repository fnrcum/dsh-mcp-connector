# Local catalog proxy TLS fixture

`key.pem` and `cert.pem` are public, test-only credentials for loopback HTTPS
servers. Never use this key outside tests. The certificate names
`catalog.example.test`, `localhost`, and `127.0.0.1`; no real service is involved.
Tests trust this certificate only in their isolated child process through
`NODE_EXTRA_CA_CERTS`, leaving TLS verification enabled. These fixtures are not
included in the npm package.
