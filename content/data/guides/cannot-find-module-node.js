module.exports = {
  "slug": "cannot-find-module-node",
  "title": "Node 'Cannot find module': Why Resolution Fails",
  "h1": "Fixing 'Cannot find module' in Node",
  "eyebrow": "Troubleshooting",
  "description": "Node says Cannot find module. Here is how require and import actually resolve a specifier, and the path, case and exports problems that break it.",
  "standfirst": "Two different resolvers print almost the same sentence. Work out which one ran, then check the small number of path conditions that produce it.",
  "keywords": [
    "cannot find module",
    "err_module_not_found",
    "node module resolution",
    "esm vs commonjs",
    "require of es module"
  ],
  "cardDesc": "Which resolver ran, what it searched, and the extension, case and exports cases behind most failures.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Two different failures share one sentence. CommonJS reports `MODULE_NOT_FOUND` with a `Require stack:` list. ES modules report `ERR_MODULE_NOT_FOUND` and name the file that did the importing.",
        "ESM does not guess extensions and does not fall back to `index.js`. `import './utils'` fails where `require('./utils')` succeeds.",
        "If the package is plainly sitting in `node_modules`, suspect the package’s `exports` field, a filename case mismatch, or a working directory you did not expect.",
        "Code that passes on macOS and fails on Linux CI is a case-sensitivity problem until proven otherwise."
      ]
    },
    {
      "t": "h2",
      "x": "Start with the error text, not with a reinstall"
    },
    {
      "t": "p",
      "x": "Deleting `node_modules` fixes a narrow class of problem and hides the rest. Read the first two lines instead. They tell you which resolver ran and which file was asking, and those two facts eliminate most of the candidate causes before you touch anything."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# CommonJS\nError: Cannot find module './utils'\nRequire stack:\n- /app/src/index.js\n    at Module._resolveFilename (node:internal/modules/cjs/loader)\n    at Module._load (node:internal/modules/cjs/loader)\n  code: 'MODULE_NOT_FOUND',\n  requireStack: [ '/app/src/index.js' ]\n\n# ES modules\nError [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/src/utils' imported from /app/src/index.js\n  code: 'ERR_MODULE_NOT_FOUND'"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "About the stack frames",
      "x": "Line numbers inside `node:internal/...` frames shift between releases, so they are trimmed above rather than quoted at a version that may not match yours. The `code` property is the stable part, and it is the part worth reading."
    },
    {
      "t": "p",
      "x": "The CommonJS form quotes the specifier exactly as you wrote it. The ESM form has already turned it into an absolute path, which is a clue in itself: if that path ends without a file extension, you wrote a bare relative import and the ESM resolver will not repair it for you. Recent Node versions also print a suggestion line naming the file they think you meant. The wording of that hint has changed across releases, so treat it as help rather than as a string to match on."
    },
    {
      "t": "h2",
      "x": "How require() resolves a specifier"
    },
    {
      "t": "p",
      "x": "The CommonJS algorithm is short. Knowing it turns most of these failures into a five second read."
    },
    {
      "t": "ol",
      "items": [
        "A specifier starting with `node:` is a built-in. Nothing else is consulted.",
        "A specifier matching a built-in name such as `fs` or `path` also resolves to the built-in, and it wins over anything installed in `node_modules` under the same name.",
        "A specifier starting with `/`, `./` or `../` is a path relative to the requiring file. Node tries it verbatim, then with `.js`, `.json` and `.node` appended.",
        "If that path turns out to be a directory, Node reads the directory’s `package.json` `main` field, then falls back to `index.js`, `index.json` and `index.node`.",
        "Anything else is a bare specifier. Node looks in `node_modules` next to the requiring file, then in the parent directory’s `node_modules`, and keeps walking up to the filesystem root."
      ]
    },
    {
      "t": "p",
      "x": "That last step is visible at runtime, which makes it the fastest thing to check when a dependency that is definitely installed cannot be found."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# run from /app/src\nnode -p \"module.paths\"\n[\n  '/app/src/node_modules',\n  '/app/node_modules',\n  '/node_modules'\n]"
    },
    {
      "t": "p",
      "x": "Your list will differ, and that is the point. The search starts from the file doing the requiring, not from wherever you ran `npm install`. `NODE_PATH` still adds directories to the CommonJS search for backward compatibility, and it is a common reason a machine with a hand-tuned shell profile works while a container does not. Any project relying on it should be treated as carrying legacy debt."
    },
    {
      "t": "h2",
      "x": "What ES modules change"
    },
    {
      "t": "p",
      "x": "The ESM resolver is stricter on purpose. It resolves specifiers as URLs, which means the result is deterministic without hitting the filesystem repeatedly to test candidate extensions. The cost of that determinism is that everything the CommonJS resolver used to paper over now surfaces as an error."
    },
    {
      "t": "table",
      "head": [
        "Behavior",
        "require() in CommonJS",
        "import in ESM"
      ],
      "rows": [
        [
          "Missing extension",
          "Tries `.js`, `.json`, `.node`",
          "Fails; the extension is part of the specifier"
        ],
        [
          "Directory import",
          "Falls back to `main`, then `index.js`",
          "Fails with `ERR_UNSUPPORTED_DIR_IMPORT`"
        ],
        [
          "Specifier form",
          "A filesystem path",
          "A URL resolved against the importing file’s URL"
        ],
        [
          "`NODE_PATH`",
          "Honoured",
          "Ignored"
        ],
        [
          "Deep import into a package",
          "Allowed only if `exports` permits it",
          "Allowed only if `exports` permits it"
        ],
        [
          "Loading an ESM-only package",
          "Historically `ERR_REQUIRE_ESM`",
          "Works"
        ]
      ],
      "caption": "One headline error, two resolvers with different rules."
    },
    {
      "t": "p",
      "x": "Which resolver reads a given `.js` file is decided by the `type` field of the nearest `package.json` above it. `\"type\": \"module\"` makes every `.js` file in that package tree an ES module. The `.mjs` and `.cjs` extensions override the field explicitly. So a codebase that suddenly cannot find its own sibling files, right after someone added `\"type\": \"module\"`, is not haunted. The extension rule has simply started applying."
    },
    {
      "t": "h2",
      "x": "The path cases that actually cause it"
    },
    {
      "t": "h3",
      "x": "A relative import with no extension"
    },
    {
      "t": "p",
      "x": "This is the single most common cause in a codebase mid-migration, and it is worth internalising the four shapes."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// index.mjs\nimport { slugify } from './utils';          // ERR_MODULE_NOT_FOUND\nimport { slugify } from './utils.js';       // resolves\nimport { slugify } from './lib';            // ERR_UNSUPPORTED_DIR_IMPORT\nimport { slugify } from './lib/index.js';   // resolves"
    },
    {
      "t": "h3",
      "x": "A filename case mismatch"
    },
    {
      "t": "p",
      "x": "macOS volumes are case insensitive by default. Most Linux filesystems are not. `./Utils.js` and `./utils.js` are one file on a laptop and two different files in a container, so the import works all through development and breaks the first time CI runs it. Git compounds this: by default it also ignores case on macOS, so a rename that only changed capitalisation may never have been recorded."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git config core.ignorecase          # true on a default macOS clone\ngit ls-files | grep -i utils        # what is actually committed\ngit mv src/Utils.js src/utils.js    # the reliable way to fix the case"
    },
    {
      "t": "h3",
      "x": "The package refuses the subpath"
    },
    {
      "t": "p",
      "x": "A deep import that used to work can stop working without your code changing, because the package added an `exports` field. That field is an allow list. Anything not named in it becomes private, including files that are still physically present on disk."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/format' is not defined by \"exports\" in /app/node_modules/some-pkg/package.json"
    },
    {
      "t": "p",
      "x": "Open the file the message names and read the `exports` map. It will show you the public entry points, which is the list you have to choose from. If the thing you need is not there, the options are to use the public API, to open an issue asking for the subpath to be exported, or to vendor the small piece of code you were reaching for. Patching the installed `package.json` works locally and will be undone by the next clean install."
    },
    {
      "t": "h3",
      "x": "The dependency is only installed in development"
    },
    {
      "t": "p",
      "x": "`npm ci --omit=dev` prunes `devDependencies`. Anything reachable from runtime code has to live in `dependencies`, and the usual failure is a module that imports a build-time helper at the top of a file that also runs in production. The error appears only in the deployed environment, which makes it look like an infrastructure problem. It is a manifest problem."
    },
    {
      "t": "h3",
      "x": "A different node_modules than the one you are looking at"
    },
    {
      "t": "p",
      "x": "Because the search walks up from the requiring file, the working directory matters, and so does the shape of the install. In a workspace, npm and Yarn hoist shared dependencies to the repository root, which is why a package you never declared in a given workspace may still import successfully. pnpm’s default layout does not hoist that way, so the same code fails there. Both behaviors are correct. The declaration was missing all along, and only one of the two tools makes you notice."
    },
    {
      "t": "p",
      "x": "Symlinked packages add one more variable. Node resolves a symlinked file to its real path by default, so a linked package looks for its dependencies next to its real location rather than next to the link. `node --preserve-symlinks` changes that, and it is occasionally the right answer for a local link setup, but reach for it after you have confirmed the layout rather than before."
    },
    {
      "t": "h3",
      "x": "Aliases only the bundler understands"
    },
    {
      "t": "p",
      "x": "`paths` in `tsconfig.json`, `resolve.alias` in a webpack or Vite config, and similar mappings are build tool features. Node does not read any of them at runtime. Code that imports `@/lib/db` runs fine under the dev server and fails the moment it is executed directly. The runtime-supported equivalent is the `imports` field in your own `package.json`, which handles specifiers beginning with `#`."
    },
    {
      "t": "code",
      "lang": "json",
      "x": "{\n  \"name\": \"my-app\",\n  \"type\": \"module\",\n  \"imports\": {\n    \"#lib/*\": \"./src/lib/*.js\"\n  }\n}"
    },
    {
      "t": "h3",
      "x": "Stale or missing build output"
    },
    {
      "t": "p",
      "x": "If the failing specifier points into `dist`, check that `dist` was rebuilt, that its internal directory layout matches what the imports assume, and that nothing is filtering it out. A `.dockerignore` or `.gitignore` entry, or a narrow `files` array in `package.json`, will each produce a module that exists on your machine and nowhere else."
    },
    {
      "t": "h2",
      "x": "The related error: require() of an ES module"
    },
    {
      "t": "p",
      "x": "This one is worth separating out because people arrive at it through the same search. The module was found. It could not be loaded the way you asked for."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error [ERR_REQUIRE_ESM]: require() of ES Module /app/node_modules/some-pkg/index.js from /app/index.js not supported."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Version dependent behavior",
      "x": "Newer Node releases can `require()` an ES module when the whole graph being loaded is synchronous, which removes this error in many cases. Support arrived on the Node 22 line and is present in later majors. Check `node -v` against the `require(esm)` section of the Node documentation for your release line before assuming either behavior, since the details have moved more than once."
    },
    {
      "t": "p",
      "x": "Where the error does apply, the fixes in order of preference are: convert the requiring file to ESM, use a dynamic `import()` at the call site, which returns a promise and is available from CommonJS, or pin the dependency to its last CommonJS version and record why in the manifest. The third option is a holding position, not a resolution."
    },
    {
      "t": "h2",
      "x": "Docker and CI specifics"
    },
    {
      "t": "p",
      "x": "Containers produce a disproportionate share of these reports, for reasons that are mechanical rather than mysterious."
    },
    {
      "t": "ul",
      "items": [
        "**Host `node_modules` copied into the image.** Native addons compiled for macOS on arm64 will not load on a Linux image. Add `node_modules` to `.dockerignore` and install inside the build.",
        "**A bind mount shadowing the install.** Mounting the project directory over `/app` replaces the image’s `node_modules` with whatever the host has, which is often nothing.",
        "**Multi-stage builds that copy `dist` and forget the runtime dependencies**, or that copy `node_modules` from a stage where dev dependencies were already pruned.",
        "**Case sensitivity**, again. The container filesystem is usually the first case-sensitive one your code has met."
      ]
    },
    {
      "t": "code",
      "lang": "yaml",
      "x": "services:\n  api:\n    build: .\n    volumes:\n      - .:/app\n      - /app/node_modules   # anonymous volume keeps the image's install"
    },
    {
      "t": "p",
      "x": "That second volume entry is the standard way to mount your source for live reload while protecting the dependencies installed during the build. It has a cost: after you change `package.json`, the volume still holds the old install, and you need to recreate it."
    },
    {
      "t": "h2",
      "x": "A diagnosis order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify the resolver",
          "x": "Read the `code` property. `MODULE_NOT_FOUND` means the CommonJS rules applied and extension guessing already happened. `ERR_MODULE_NOT_FOUND` means it did not."
        },
        {
          "title": "Ask Node where it would look",
          "x": "Do this from the same directory the process actually starts in, not from wherever your shell happens to be.",
          "code": "node -p \"module.paths\"\nnode -e \"console.log(require.resolve('some-pkg'))\"\nnode --input-type=module -e \"console.log(import.meta.resolve('some-pkg'))\""
        },
        {
          "title": "Confirm the file exists under exactly that name",
          "x": "A case-insensitive search that finds a near miss is the answer, not a false alarm.",
          "code": "ls -l node_modules/some-pkg/package.json\nfind src -iname 'utils*'"
        },
        {
          "title": "Read the package's entry points",
          "x": "Look at `exports`, `main`, `module` and `type` in the installed `package.json`. Read it with a shell tool rather than importing it, because `exports` can block the manifest itself.",
          "code": "head -40 node_modules/some-pkg/package.json"
        },
        {
          "title": "Reproduce inside the environment that fails",
          "x": "If the failure is only in CI or a container, run the same probes there. A local reproduction that succeeds has told you nothing about the environment that is broken.",
          "code": "docker compose run --rm api node -p \"module.paths\""
        },
        {
          "title": "Only now reinstall",
          "x": "A clean install is the right fix for a corrupted or partially written tree, which is real but uncommon. Doing it first destroys the evidence you needed for every other cause.",
          "code": "rm -rf node_modules && npm ci"
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Make the class of bug impossible",
      "x": "An ESLint rule requiring file extensions on relative imports, plus a Linux-based CI job that runs on every pull request, catches the extension and case cases before review. Both are cheaper than the debugging session."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "npm ERESOLVE dependency conflicts",
          "desc": "When the install itself refuses to produce a tree.",
          "href": "/guides/npm-eresolve-error/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Docker container exits immediately",
          "desc": "A container that dies on startup often dies on a failed import.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "JavaScript async/await",
          "desc": "Dynamic import() returns a promise, with the usual consequences.",
          "href": "/guides/javascript-async-await-explained/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why does it work locally but not in Docker?",
          "a": "Three causes account for most of it. The container filesystem is case sensitive and your laptop’s is not, so a capitalisation mistake surfaces for the first time. A bind mount is covering the image’s `node_modules`. Or `node_modules` was copied in from the host with binaries built for the wrong platform. Run `node -p \"module.paths\"` inside the container to see what the process can actually reach."
        },
        {
          "q": "What is the difference between MODULE_NOT_FOUND and ERR_MODULE_NOT_FOUND?",
          "a": "They come from different resolvers. `MODULE_NOT_FOUND` is CommonJS, which means Node already tried appending `.js`, `.json` and `.node` and tried the directory as a package before giving up. `ERR_MODULE_NOT_FOUND` is the ESM resolver, which does none of that. The second one very often just means a missing file extension."
        },
        {
          "q": "Do I need to write .js extensions in TypeScript imports?",
          "a": "Under the `node16` or `nodenext` module settings, yes: you write `./utils.js` in the source even though the file on disk is `utils.ts`, because the specifier describes the emitted output that Node will load. It looks wrong and it is correct. Bundler-oriented settings do not require it, which is why the same codebase can behave differently depending on how a given file is executed."
        },
        {
          "q": "Can I make ESM guess extensions like CommonJS does?",
          "a": "Do not build on it. Node had an experimental flag for this and it was not a stable part of the platform; the supported approaches are writing full specifiers or supplying a custom resolver hook. Writing the extension takes less time than maintaining either alternative."
        },
        {
          "q": "Why can't I import a file that clearly exists inside a package?",
          "a": "Almost certainly the package’s `exports` field, which acts as an allow list and makes every unlisted path private regardless of what is on disk. The error is `ERR_PACKAGE_PATH_NOT_EXPORTED` and it names the manifest to read. Editing that manifest inside `node_modules` will work until the next install and no longer."
        },
        {
          "q": "Should I just delete node_modules and reinstall?",
          "a": "It is a reasonable step once you have ruled out the specifier, the case, the `exports` map and the environment. It repairs a partially written or corrupted tree. It cannot repair a missing extension, a dependency in the wrong section of the manifest, or an alias that only your bundler understands, and doing it first removes the state you would have inspected."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-08-30",
  "updated": "2026-08-30",
  "author": "jackson"
};
