# Component Documentation

Static documentation for the standalone headless UI component libraries.

## Local use

Serve this directory with any static file server, then open `index.html`:

```bash
python -m http.server 4175 --directory components-docs
```

The full reference is in [`documentation.html`](documentation.html). The site has
no package or build step because it follows the existing static `sdk-docs`
documentation setup. It is ready to deploy as static files.

The examples are based on the current exports from `@media/ui-react` and
`@media/ui-native`; the component packages remain independent from the SDK.
