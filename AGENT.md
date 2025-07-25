

**Task: Modernize and Test Foxify Chrome-to-Firefox Extension Converter**

You need to update the Foxify project (a 6-year-old Node.js web application that converts Chrome extensions to Firefox-compatible format) to work with modern systems and dependencies.

### Phase 1: Dependency Modernization

1. **Update Node.js compatibility**: The project currently targets Node.js 10.x (package.json:9-39). Update to support Node.js 18+ LTS.

2. **Modernize core dependencies**:
   - Update Express from 4.17.1 to latest 4.x
   - Update EJS from 2.5.7 to latest version
   - Replace deprecated `request` library (2.83.0) with `axios` or `fetch`
   - Update `body-parser`, `cookie-parser`, `morgan` to latest versions
   - Update `convict` from 4.4.1 to latest version

3. **Modernize build system** (package.json:26-38): 
   - Upgrade Webpack from 4.32.2 to Webpack 5.x
   - Update all webpack loaders and plugins to compatible versions
   - Replace deprecated `node-sass` with `sass`
   - Update CSS and file loaders to latest versions

4. **Security updates**: Run `npm audit` and fix all vulnerabilities, especially in `debug`, `dotenv`, and other core packages.

### Phase 2: Code Compatibility

1. **Test startup process**: Verify the server bootstrap in `bin/www` still works with updated dependencies (www:49-58)

2. **Update npm scripts**: Ensure `npm start` and `npm run watch` commands work with updated tooling (package.json:5-7)

3. **Check custom conversion libraries**: Verify that the core conversion logic in `crxtozip` and `ziptoxpi` libraries still function correctly with updated dependencies

### Phase 3: External API Compatibility

1. **Chrome Web Store integration**: Test if the Chrome Web Store download URLs and API endpoints still work as expected for fetching CRX files

2. **Firefox extension compatibility**: Verify that generated XPI files are compatible with current Firefox versions and extension manifest formats

### Phase 4: Testing & Validation

1. **Setup testing environment**:
   - Install updated dependencies: `npm install`
   - Configure environment: `cp .env.example .env`
   - Start development server: `npm start`
   - Build assets: `npm run watch`

2. **Functional testing**:
   - Test the web interface loads at `http://localhost:3000`
   - Test downloading a sample Chrome extension
   - Test conversion to ZIP, XPI, and CRX formats
   - Verify converted extensions install properly in Firefox

3. **Error handling**: Test edge cases like large extensions, network failures, and malformed extension files

### Phase 5: Documentation Updates

1. Update README with new Node.js version requirements
2. Update installation instructions for modern npm/Node.js
3. Document any breaking changes or new configuration options

### Success Criteria

- Application starts without errors on Node.js 18+
- All npm audit vulnerabilities resolved
- Chrome extension download and conversion pipeline works end-to-end
- Generated XPI files install successfully in current Firefox versions
- Build system produces optimized assets without warnings

## Notes

This prompt focuses on the core modernization challenges identified in the codebase analysis. The project's custom conversion logic should remain largely intact, but the surrounding infrastructure needs significant updates to work with modern Node.js and browser environments.

Web pages you might want to explore:
- Getting Started ([bnpoirier/foxify](https://deepwiki.com/bnpoirier/foxify/2-getting-started))

Issues to scan over: [https://github.com/bnpoirier/foxify/issues](https://github.com/bnpoirier/foxify/issues)

Pull requests to consider: [https://github.com/bnpoirier/foxify/pulls](https://github.com/bnpoirier/foxify/pulls)

## Additional Tools Available

- `gh` github command line client
- `git` git command line client