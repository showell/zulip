### To run the dev server with HMR:

`./tools/webpack --watch --config=frontend`

Then head over to `127.0.0.1/webpack/showcase.html`

You can edit files in `web/showcase_src` for HMR updates.

### To build/view static assets:
`python ./tools/generate_showcase_static_assets.py`

You can then start a static file server in `static/webpack-bundles`

    (cd static/webpack-bundles/ && python3 -m http.server 8000)

View it in the browser!:

    http://localhost:8000/showcase.html
