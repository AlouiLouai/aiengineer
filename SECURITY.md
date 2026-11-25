# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead: on this repository, go to
**Security → Report a vulnerability**. Include the steps to reproduce and the affected page.

You can expect a reply within a week.

## Scope

The site is static: no accounts, no server code and no data leaves the browser (progress is kept in
`localStorage`). Each page carries a Content-Security-Policy that allows only its own scripts. Relevant reports
include script injection, a weakened policy, and problems in the build or deployment configuration.
