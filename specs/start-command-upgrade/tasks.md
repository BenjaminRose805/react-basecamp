# Tasks: /start Command Upgrade

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** start-command-upgrade

## Progress

- [ ] Phase 1: Core Environment Check Script (0/4)
- [ ] Phase 2: Tool Installation Helper (0/3)
- [ ] Phase 3: Configuration (0/2)
- [ ] Phase 4: State Management (0/1)
- [ ] Phase 5: Output Formatting (0/1)
- [ ] Phase 6: Hook Integration (0/2)
- [ ] Phase 7: Command Update (0/2)
- [ ] Phase 8: Edge Cases (0/3)
- [ ] Phase 9: Testing and Documentation (0/2)

**Total:** 0/20 tasks complete

---

## Phase 1: Core Environment Check Script

Create the main environment check orchestrator script.

- [ ] **T001** [FR-04] Create dependency check function
  - Create `.claude/scripts/environment-check.cjs` file
  - Implement `checkDependencies()` function
  - Detect package manager using `getPackageManager()` from package-manager.cjs
  - Check for node_modules directory existence
  - Run package install command if node_modules missing
  - Return structured result: `{ status: 'ok' | 'error', packageManager, nodeModulesExists, installRequired, installTime }`
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Create environment-check.cjs with checkDependencies() function. Import getPackageManager from ../lib/package-manager.cjs. Detect package manager (check for pnpm-lock.yaml → pnpm, yarn.lock → yarn, package-lock.json → npm, bun.lockb → bun). Check if node_modules directory exists using fs.existsSync. If missing, run install command (e.g., "pnpm install"). Return object with status, packageManager, nodeModulesExists, installRequired, installTime fields. Handle errors gracefully (e.g., install fails → return status: 'error'). | Restrictions: Use async/await, handle errors with try/catch, return structured results not console output, use existing getPackageManager() utility | Success: Function returns correct package manager, detects missing node_modules, runs install when needed, returns structured result object, handles errors without crashing

- [ ] **T002** [FR-08, FR-09, FR-10, FR-11] Create tooling check function
  - Implement `checkTooling()` function in environment-check.cjs
  - Load tool configuration from `.claude/config/environment.json`
  - For each tool in requiredTools array:
    - Check if command exists using `commandExists()` from utils.cjs
    - Get version using tool's check command
    - Check authentication status using authCheck command
  - Return structured result: `{ [toolName]: { installed, version, authenticated, skipped, unsupported } }`
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add checkTooling() function to environment-check.cjs. Load tool configuration from .claude/config/environment.json (create if missing, use default config from design.md). Iterate over requiredTools array. For each tool: (1) Use commandExists() from utils.cjs to check installation, (2) Run check command to get version (parse from output), (3) Run authCheck command to verify authentication (handle errors if not authenticated). Return object with toolName as keys, each containing installed (bool), version (string|null), authenticated (bool), skipped (bool for user cancellations), unsupported (bool for Windows+CodeRabbit). Handle command failures gracefully (tool not found → installed: false). | Restrictions: Use commandExists() and runCommand() from utils.cjs, load config from environment.json, handle missing config gracefully with defaults, don't prompt user here (that's for install-tools.cjs), return structured data | Success: Function checks all configured tools, detects installation status, gets version numbers, checks authentication, handles errors without crashing, returns structured result

- [ ] **T003** [FR-15, FR-16, FR-17, FR-18, FR-19] Create verification check function
  - Implement `runVerification(options)` function in environment-check.cjs
  - Load verification commands from `.claude/config/environment.json`
  - Run lint check (with auto-fix if errors found and autoFix enabled)
  - Run typecheck (parse errors with file:line format)
  - Run tests (quick mode by default, full mode if options.fullMode)
  - Run build (only if options.fullMode and fullOnly: true)
  - Return structured result: `{ [checkName]: { status, errors, warnings, autoFixed, details } }`
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add runVerification(options = {}) function to environment-check.cjs. Load verification config from environment.json. For each check (lint, typecheck, tests, build): (1) Skip if fullOnly: true and !options.fullMode, (2) Run command using runCommand() from utils.cjs, (3) Parse output for errors/warnings, (4) If check fails and autoFix command exists, run auto-fix and re-check, (5) Return structured result. For lint: parse error count, run lint --fix if errors found and autoFix enabled, re-check. For typecheck: parse errors in "file:line - message" format. For tests: parse passed/failed/skipped counts and duration. For build: capture duration. Return object with checkName keys containing status ('pass'|'fail'|'fixed'|'skipped'), errors (number), warnings (number), autoFixed (bool), details (array of error objects). | Restrictions: Use runCommand() from utils.cjs, handle command failures gracefully, parse output using regex, support options.fullMode flag, implement auto-fix retry logic for lint, return structured data | Success: Function runs all verification checks, parses output correctly, auto-fixes lint errors when possible, re-checks after fix, handles full mode flag, returns structured results with all fields

- [ ] **T004** [FR-01, FR-02, FR-05] Create main orchestrator function
  - Implement `environmentCheck(options)` function in environment-check.cjs
  - Call checkDependencies(), checkTooling(), runVerification(), checkGit() in sequence
  - Aggregate results into single status object
  - Determine overall status: 'ready' if all pass, 'issues' if any failures
  - Collect issues array with phase, severity, message, fix fields
  - Export environmentCheck as main entry point
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add main environmentCheck(options = {}) function to environment-check.cjs that orchestrates all checks. Call functions in sequence: (1) checkDependencies(), (2) checkTooling(), (3) runVerification(options), (4) checkGit() (new function to add - checks current branch, git status, ahead/behind). Aggregate results into single object matching state file schema from design.md. Determine overall status: 'ready' if all phases ok, 'issues' if any failures. Build issues array from failures across all phases, each issue containing: phase ('dependencies'|'tooling'|'verification'|'git'), severity ('critical'|'warning'|'info'), message (description), fix (command to run). Export environmentCheck as module.exports. Handle errors in any phase gracefully (log error, continue to next phase). | Restrictions: Call all phase functions, handle errors without crashing, aggregate results into state schema, calculate overall status correctly, build issues array from failures, export as main function | Success: Function orchestrates all 4 phases, handles errors in any phase, aggregates results correctly, calculates overall status, populates issues array with actionable fixes, exports as module entry point

---

## Phase 2: Tool Installation Helper

Create helper functions for automatic tool installation.

- [ ] **T005** [FR-09, FR-12, FR-13] Create CodeRabbit CLI installation function
  - Create `.claude/scripts/install-tools.cjs` file
  - Implement `installCodeRabbit(options)` function
  - Check platform (skip if Windows with unsupported: true)
  - Prompt user for confirmation if options.prompt is true
  - Run curl install script: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
  - Verify installation by checking `coderabbit --version`
  - Handle permission errors (suggest sudo)
  - Return result: `{ installed: true | false, skipped: bool, unsupported: bool, error: string | null }`
  - File: `.claude/scripts/install-tools.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Create install-tools.cjs with installCodeRabbit(options = { prompt: true }) function. Check platform using process.platform - if win32, return { installed: false, unsupported: true } immediately. If options.prompt is true, use readline to ask "Install CodeRabbit CLI for local code review? (y/n)" and wait for user input. If user says no, return { installed: false, skipped: true }. If yes or prompt disabled, run "curl -fsSL https://cli.coderabbit.ai/install.sh | sh" using runCommand() from utils.cjs. After install, verify by running "coderabbit --version". If verification fails, return { installed: false, error: 'Install failed' }. Catch permission errors (check if error.message includes 'permission') and return { installed: false, error: 'Permission denied - try: sudo curl ...' }. Return { installed: true } on success. | Restrictions: Use runCommand() from utils.cjs, handle user prompts with readline, check platform before install, verify installation after, handle permission errors, return structured result | Success: Function checks platform first, prompts user when requested, runs install script, verifies installation, handles permission errors with actionable message, returns structured result

- [ ] **T006** [FR-11] Create CodeRabbit authentication check and prompt
  - Implement `checkCodeRabbitAuth()` function in install-tools.cjs
  - Run `coderabbit auth status` command
  - If authenticated, return `{ authenticated: true }`
  - If not authenticated, prompt user to run `coderabbit auth login`
  - Wait for user to complete auth (prompt to press Enter when done)
  - Re-check auth status after user confirms
  - Return result: `{ authenticated: true | false, prompted: bool }`
  - File: `.claude/scripts/install-tools.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add checkCodeRabbitAuth() function to install-tools.cjs. Run "coderabbit auth status" using runCommand() from utils.cjs. If command succeeds (exit code 0), return { authenticated: true }. If command fails (exit code non-zero), prompt user: "CodeRabbit CLI not authenticated. Please run: coderabbit auth login" and "Press Enter after authentication completes...". Use readline to wait for Enter key. After user presses Enter, re-run "coderabbit auth status" to verify. If still not authenticated, return { authenticated: false, prompted: true, error: 'Authentication failed - user may have cancelled' }. If authenticated, return { authenticated: true, prompted: true }. | Restrictions: Use runCommand() from utils.cjs, handle command failures gracefully, use readline for user prompts, re-check after user confirms, return structured result | Success: Function checks auth status, detects when not authenticated, prompts user with clear instructions, waits for completion, re-checks status, returns structured result

- [ ] **T007** [FR-10] Create GitHub CLI check function
  - Implement `checkGitHubCLI()` function in install-tools.cjs
  - Check if `gh` command exists using commandExists()
  - If not installed, return `{ installed: false, message: 'Install GitHub CLI: https://cli.github.com' }`
  - If installed, get version and check auth status using `gh auth status`
  - Parse username from auth status output
  - Return result: `{ installed: bool, version: string | null, authenticated: bool, user: string | null }`
  - File: `.claude/scripts/install-tools.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add checkGitHubCLI() function to install-tools.cjs. Check if "gh" command exists using commandExists() from utils.cjs. If not found, return { installed: false, message: 'Install GitHub CLI: https://cli.github.com' }. If found, run "gh --version" to get version (parse from output like "gh version 2.40.0"). Run "gh auth status" to check authentication - if succeeds, parse username from output (usually format "Logged in to github.com as USERNAME"), if fails, authenticated: false and user: null. Return { installed: true, version: '2.40.0', authenticated: true|false, user: 'username'|null }. Handle errors gracefully (command failures, parsing errors). | Restrictions: Use commandExists() and runCommand() from utils.cjs, parse version and username from command output, handle gh not installed vs installed but not authenticated, return structured result | Success: Function checks gh installation, gets version when installed, checks auth status, parses username when authenticated, handles not installed case, returns structured result

---

## Phase 3: Configuration

Create configuration schema and default configuration file.

- [ ] **T008** [NFR-02] Create environment configuration file
  - Create `.claude/config/environment.json`
  - Define requiredTools array with CodeRabbit CLI and GitHub CLI entries
  - Define verification commands for lint, typecheck, tests, build
  - Define autoFix settings (dependencies: true, lint: true, tools: 'prompt')
  - Include platform restrictions for CodeRabbit CLI (linux, darwin only)
  - Use schema from design.md
  - File: `.claude/config/environment.json`
  - **\_Prompt**: Role: Backend Developer | Task: Create .claude/config/environment.json with configuration schema from design.md. Include: (1) requiredTools array with two entries - coderabbit (check: "coderabbit --version", install: "curl -fsSL https://cli.coderabbit.ai/install.sh | sh", installPrompt: "Install CodeRabbit CLI for local code review?", authCheck: "coderabbit auth status", platforms: ["linux", "darwin"]) and gh (check: "gh --version", install: null, installPrompt: "GitHub CLI required. Install: https://cli.github.com", authCheck: "gh auth status", platforms: ["linux", "darwin", "win32"]). (2) verification object with lint (command: "pnpm lint --quiet", autoFix: "pnpm lint --fix", required: true), typecheck (command: "pnpm typecheck", autoFix: null, required: true), tests (command: "pnpm test --run", autoFix: null, required: false), build (command: "pnpm build", autoFix: null, required: false, fullOnly: true). (3) autoFix object with dependencies: true, lint: true, tools: "prompt". Format JSON with 2-space indentation. | Restrictions: Follow exact schema from design.md, use proper JSON formatting, include all fields, use null for unavailable values (like gh install command) | Success: File created with valid JSON, all required fields present, schema matches design.md exactly, proper formatting

- [ ] **T009** Add .claude/config directory check
  - Update environment-check.cjs to check if `.claude/config/` directory exists
  - If missing, create directory using fs.mkdirSync with recursive: true
  - Check if environment.json exists, if missing create with default config from T008
  - Log warning if config was created: "Created default environment config"
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add config directory check to environment-check.cjs. At the top of checkTooling() function, check if .claude/config directory exists using fs.existsSync. If missing, create it using fs.mkdirSync('.claude/config', { recursive: true }). Check if .claude/config/environment.json exists. If missing, create it with default config (copy content from T008). If config was created, log to console: "⚠ Created default environment config at .claude/config/environment.json". This ensures config always exists before trying to load it. | Restrictions: Use fs module, create directory recursively, create default config if missing, log warning when creating defaults, don't fail if directory already exists | Success: Function creates .claude/config if missing, creates environment.json with defaults if missing, logs warning when creating defaults, doesn't crash if already exists

---

## Phase 4: State Management

Create state file writer and schema validation.

- [ ] **T010** [FR-21, FR-22, FR-23] Create state file writer
  - Implement `writeStateFile(results, outputPath)` function in environment-check.cjs
  - Accept results object from environmentCheck()
  - Add timestamp field (ISO 8601 format)
  - Validate schema matches design.md state file schema
  - Write to `start-status.json` (default) or custom outputPath
  - Handle write errors gracefully (permissions, disk full)
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add writeStateFile(results, outputPath = 'start-status.json') function to environment-check.cjs. Add timestamp field to results object using new Date().toISOString(). Ensure results object matches state file schema from design.md (should already match from environmentCheck() output). Write JSON to file using fs.writeFileSync(outputPath, JSON.stringify(results, null, 2)). Wrap in try/catch to handle write errors - if error, log warning: "⚠ Failed to write state file: [error.message]" and return false. Return true on success. Call this function at end of environmentCheck() before returning results. | Restrictions: Use fs.writeFileSync, format JSON with 2-space indentation, add timestamp, handle errors without crashing, return success boolean | Success: Function adds timestamp to results, writes JSON to file with proper formatting, handles write errors gracefully with logged warning, returns success status

---

## Phase 5: Output Formatting

Create terminal output formatter with box-drawing characters.

- [ ] **T011** [NFR-06] Create report formatter
  - Implement `generateReport(results)` function in environment-check.cjs
  - Use box-drawing characters: ┌─┐ │ ├─┤ └─┘
  - Use status symbols: ✓ (pass), ✗ (fail), ⚠ (warning)
  - Format each phase section (DEPENDENCIES, TOOLING, VERIFICATION, GIT)
  - Show actionable fix instructions for failures (→ Run: [command])
  - Return formatted string (not console.log)
  - Match output format from design.md
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add generateReport(results) function to environment-check.cjs. Build formatted string using box-drawing characters and status symbols. Start with header box: "┌─────...─┐\n│ /start - Environment [Ready|Issues Found] │\n├─────...─┤". For each phase (dependencies, tooling, verification, git), add section header (e.g., "│ DEPENDENCIES │") then iterate over items: (1) Pass → "│ ✓ [item] │", (2) Fail → "│ ✗ [item] │\n│ → Run: [fix command] │". For verification, show error counts (e.g., "✓ Lint: passed (0 errors, 2 warnings)"). For typecheck failures, show first 3 errors with file:line. End with footer: "├─────...─┤\n│ [✓ Ready to work!|⚠ Fix issues above] │\n└─────...─┘". Use ANSI color codes: green for ✓, red for ✗, yellow for ⚠. Return formatted string. Reference output format examples in design.md. | Restrictions: Return string (don't console.log), use box-drawing chars consistently, include fix commands for failures, limit displayed errors (first 3), use ANSI colors, match design.md format | Success: Function returns formatted string with box layout, correct status symbols, appropriate colors, actionable fix instructions, matches examples in design.md

---

## Phase 6: Hook Integration

Create and register the UserPromptSubmit hook.

- [ ] **T012** [FR-24, FR-25] Create user-prompt-start hook
  - Create `.claude/scripts/hooks/user-prompt-start.cjs`
  - Implement UserPromptSubmit hook that triggers on `/start` command
  - Import environmentCheck from environment-check.cjs
  - Parse command for flags (--full, --security)
  - Call environmentCheck with appropriate options
  - Generate report using generateReport()
  - Return inject object with report summary
  - File: `.claude/scripts/hooks/user-prompt-start.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Create .claude/scripts/hooks/user-prompt-start.cjs with UserPromptSubmit hook. Export object with: name: 'user-prompt-start', trigger: 'UserPromptSubmit', condition: (prompt) => /^\/start\b/i.test(prompt.message), action: async (prompt) => {...}. In action function: (1) Import environmentCheck and generateReport from ../environment-check.cjs, (2) Parse prompt.message for flags (check if includes '--full' → fullMode: true, includes '--security' → securityMode: true), (3) Set skipPrompts: process.env.CI === 'true', (4) Call results = await environmentCheck({ fullMode, securityMode, skipPrompts }), (5) Call summary = generateReport(results), (6) Return { inject: summary, state: results }. Handle errors in environmentCheck (wrap in try/catch, return error message if fails). | Restrictions: Follow hook pattern from other hooks in .claude/scripts/hooks/, use regex for command detection with word boundary, parse flags correctly, handle CI environment, return inject object with formatted summary | Success: Hook triggers on /start command, parses flags correctly, calls environmentCheck with options, generates report, returns inject object with summary and state, handles errors gracefully

- [ ] **T013** Register hook in settings.json
  - Open `.claude/settings.json`
  - Add entry to hooks array: `{ "file": "hooks/user-prompt-start.cjs", "enabled": true }`
  - Ensure hooks array exists (create if missing)
  - Verify JSON syntax is valid after addition
  - File: `.claude/settings.json`
  - **\_Prompt**: Role: Backend Developer | Task: Update .claude/settings.json to register user-prompt-start hook. Load existing settings.json, parse JSON. Check if "hooks" array exists - if not, create it. Add new entry to hooks array: { "file": "hooks/user-prompt-start.cjs", "enabled": true }. Write updated JSON back to file with proper formatting (2-space indentation). Verify no duplicate entries exist for this hook before adding. | Restrictions: Preserve existing settings.json content, parse and write valid JSON, use 2-space indentation, check for duplicates before adding, handle missing hooks array gracefully | Success: Hook registered in settings.json, JSON is valid, no duplicates, existing content preserved, proper formatting

---

## Phase 7: Command Update

Update command documentation and agent integration.

- [ ] **T014** [NFR-08, FR-01] Update /start command documentation
  - Open `.claude/commands/start.md`
  - Update command description to include environment verification
  - Document 5 phases: DEPENDENCIES, TOOLING, VERIFICATION, GIT SETUP, REPORT
  - Add flag documentation: `--full` (full verification), `--security` (security audit)
  - Update preview section to show environment check before git operations
  - Document output format (success and failure cases)
  - File: `.claude/commands/start.md`
  - **\_Prompt**: Role: Technical Writer | Task: Update .claude/commands/start.md to document new environment verification workflow. Add section describing 5 phases: (1) DEPENDENCIES - package manager detection and install, (2) TOOLING - CodeRabbit/GitHub CLI check and install, (3) VERIFICATION - lint/typecheck/tests, (4) GIT SETUP - branch creation (existing), (5) REPORT - status summary. Document flags: --full (run full test suite and build), --security (run pnpm audit). Add examples showing /start [feature-name], /start feature --full, /start feature --security. Include output examples (success and failure cases from design.md). Update preview section to show environment check happens before git operations. Preserve existing git operation documentation. | Restrictions: Follow existing command file format, include all 5 phases, document flags clearly, provide examples, preserve existing content where relevant | Success: Documentation updated with 5 phases, flags documented, examples provided, output format shown, preview updated, existing content preserved

- [ ] **T015** [NFR-08] Update git-agent integration
  - Open `.claude/agents/git-agent.md`
  - Document that environment status is injected by user-prompt-start hook
  - Add note about checking results.status before proceeding
  - Document how to access start-status.json for detailed results
  - Add error handling guidance when status is 'issues'
  - File: `.claude/agents/git-agent.md`
  - **\_Prompt**: Role: Technical Writer | Task: Update .claude/agents/git-agent.md to document environment verification integration. Add section explaining: (1) Environment status is injected by user-prompt-start.cjs hook before agent runs, (2) Agent receives formatted summary in context injection, (3) Detailed results available in start-status.json file (can read with Read tool if needed), (4) If results.status is 'issues', agent should acknowledge problems and ask user if they want to proceed or fix issues first, (5) Agent should not block work if verification fails (warn only), user may have valid reasons to proceed. Add guidance on how to reference environment issues in agent responses (e.g., "Note: TypeCheck found 3 errors. Continue anyway?"). | Restrictions: Follow existing agent documentation format, preserve existing git-agent content, add integration notes without changing agent behavior, emphasize non-blocking approach | Success: Documentation added explaining hook integration, accessing results, handling issues status, non-blocking guidance, existing content preserved

---

## Phase 8: Edge Cases

Handle platform-specific and environmental edge cases.

- [ ] **T016** [NFR-04] Add offline mode detection
  - Add `isOnline()` function to environment-check.cjs
  - Check network connectivity by attempting DNS lookup (e.g., dns.resolve('github.com'))
  - If offline, skip CodeRabbit/GitHub authentication checks
  - Log warning: "⚠ Offline mode: Skipping network-dependent checks"
  - Mark skipped checks in results with skipped: true
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add isOnline() async function to environment-check.cjs. Use dns.promises.resolve('github.com') wrapped in try/catch - if resolves, return true; if fails (ENOTFOUND, ENETUNREACH), return false. Call this at start of checkTooling(). If offline (isOnline() returns false), set skipNetworkChecks flag. When skipNetworkChecks is true: (1) Skip CodeRabbit auth check (mark authenticated: false, skipped: true), (2) Skip GitHub CLI auth check (mark authenticated: false, skipped: true), (3) Log warning to console: "⚠ Offline mode: Skipping network-dependent checks". Update generateReport() to show "(skipped - offline)" for skipped checks instead of failure message. | Restrictions: Use dns.promises from Node.js, handle DNS errors gracefully, don't fail if offline, mark checks as skipped not failed, update report formatting for skipped checks | Success: Function detects online/offline status, skips network checks when offline, marks checks as skipped, logs warning, report shows skipped status not failures

- [ ] **T017** [NFR-05] Add CI environment detection
  - Check for `process.env.CI === 'true'` at start of environmentCheck()
  - If CI mode, skip all user prompts (installCodeRabbit with prompt: false)
  - Log info: "CI mode: Skipping interactive prompts"
  - Disable auto-install tools (report missing instead)
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add CI mode detection to environmentCheck() function. At start of function, check if process.env.CI === 'true'. If true, set options.ciMode = true and log "ℹ CI mode: Skipping interactive prompts". Pass ciMode to checkTooling(). In checkTooling(), when ciMode is true: (1) Don't call installCodeRabbit() even if missing (report installed: false instead), (2) Don't prompt for authentication (report authenticated: false), (3) Mark issues with severity: 'info' instead of 'critical' (CI may have tools in different paths). Update install-tools.cjs to accept ciMode option and skip all user prompts when true. | Restrictions: Check process.env.CI at start, pass ciMode through options, disable prompts in CI, don't auto-install in CI, log CI mode detection, handle gracefully without failing | Success: Function detects CI environment, disables prompts, skips auto-install, logs CI mode, reports missing tools without blocking, handles CI gracefully

- [ ] **T018** [NFR-03, FR-13] Add Windows platform detection
  - Check for `process.platform === 'win32'` in checkTooling()
  - Skip CodeRabbit CLI installation on Windows
  - Log warning: "⚠ CodeRabbit CLI not available on Windows"
  - Mark CodeRabbit as unsupported: true in results
  - Update generateReport() to show "(unsupported on Windows)" message
  - File: `.claude/scripts/environment-check.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add Windows platform detection to checkTooling() function. Check process.platform - if win32, skip CodeRabbit checks: (1) Don't attempt to install CodeRabbit, (2) Set coderabbit result: { installed: false, unsupported: true, version: null, authenticated: false }, (3) Log warning: "⚠ CodeRabbit CLI not available on Windows". Update generateReport() to handle unsupported tools - show "⚠ CodeRabbit CLI (unsupported on Windows)" instead of error. GitHub CLI should still be checked on Windows (it's supported). Reference platform restrictions from environment.json config (tools with platforms array excluding win32 should be marked unsupported on Windows). | Restrictions: Check process.platform early, skip unsupported tools gracefully, mark with unsupported flag, update report formatting for unsupported tools, still check supported tools like gh CLI | Success: Function detects Windows platform, skips CodeRabbit on Windows, marks as unsupported, logs warning, report shows unsupported status, GitHub CLI still checked

---

## Phase 9: Testing and Documentation

Test the complete workflow and update documentation.

- [ ] **T019** [NFR-01] Test full /start workflow
  - Test fresh clone scenario (missing node_modules, no tools)
  - Verify: Dependencies install automatically
  - Verify: CodeRabbit CLI installation prompts correctly
  - Verify: Verification checks run (lint, typecheck, tests)
  - Verify: Git operations complete (branch creation)
  - Verify: start-status.json created with correct schema
  - Verify: Terminal output matches design.md format
  - Test with flags: /start feature --full (runs build and full tests)
  - Test with flags: /start feature --security (runs pnpm audit)
  - Test error cases: type errors, test failures, missing tools
  - File: N/A (manual testing)
  - **\_Prompt**: Role: QA Engineer | Task: Test complete /start workflow end-to-end. Setup: Clone repo to fresh directory (or delete node_modules and CodeRabbit CLI). Test cases: (1) Run /start test-feature - verify dependency install runs, CodeRabbit install prompts, verification runs, git branch created, start-status.json exists with valid schema, terminal shows box-formatted output. (2) Run /start feature --full - verify build runs, full test suite runs. (3) Run /start feature --security - verify pnpm audit runs. (4) Test failure cases: introduce type error in code, run /start, verify error is reported with file:line. (5) Test user cancels CodeRabbit install prompt, verify skipped: true in results. (6) Check start-status.json schema matches design.md exactly. (7) Verify terminal output uses box-drawing chars, colors (✓ green, ✗ red, ⚠ yellow), actionable fix commands. Document all findings, report any issues with reproduction steps. | Restrictions: Test in isolated environment, don't modify production code during testing, test all flags, test error cases, verify schema, check output formatting | Success: All test cases pass, dependencies install correctly, prompts work, verification runs, git operations succeed, state file schema correct, terminal output matches design.md, flags work as expected, error cases handled gracefully

- [ ] **T020** Update root README and .gitignore
  - Add `start-status.json` to `.gitignore` if not already present
  - Update root README.md with `/start` command documentation
  - Link to `specs/start-command-upgrade/` for detailed implementation notes
  - Document flags (--full, --security)
  - Add troubleshooting section for common issues
  - Files: `.gitignore`, `README.md`
  - **\_Prompt**: Role: Technical Writer | Task: Update project documentation. (1) Open .gitignore, add "start-status.json" if not present (check first to avoid duplicates). (2) Open README.md, add or update /start command section. Document: Purpose (one-command environment setup), Usage (/start [feature-name], /start feature --full, /start feature --security), What it checks (dependencies, tools, verification, git), Output (terminal summary and start-status.json file), Flags (--full for build and full tests, --security for audit). Add troubleshooting section: "CodeRabbit install fails with permission error → Use sudo or install manually", "Type errors block work → They're warnings only, you can proceed", "Tests fail → Fix tests or use /start without --full flag for quick checks". Link to specs/start-command-upgrade/ for implementation details. | Restrictions: Preserve existing README content, add start-status.json to gitignore only if missing, document flags clearly, provide troubleshooting for common issues, format consistently with existing README style | Success: .gitignore includes start-status.json, README documents /start command with usage examples, flags documented, troubleshooting section added, link to spec provided, existing content preserved

---

## Task Dependencies

```text
T001 (checkDependencies)    T002 (checkTooling)    T003 (runVerification)
       |                            |                        |
       +----------------------------+------------------------+
                                    |
                                    v
                            T004 (environmentCheck)
                                    |
           +------------------------+------------------------+
           |                        |                        |
           v                        v                        v
    T005 (install)          T008 (config)            T010 (state)
           |                        |                        |
    T006 (auth check)        T009 (dir check)               |
           |                        |                        |
    T007 (gh check)                 |                        |
           |                        |                        |
           +------------------------+------------------------+
                                    |
                                    v
                            T011 (report format)
                                    |
                                    v
                            T012 (hook create)
                                    |
                                    v
                            T013 (hook register)
                                    |
           +------------------------+------------------------+
           |                        |                        |
           v                        v                        v
    T014 (start.md)         T016 (offline)           T019 (testing)
           |                        |                        |
    T015 (git-agent.md)     T017 (CI mode)                  |
                                    |                        |
                            T018 (Windows)                   |
                                    |                        |
                                    +------------------------+
                                                             |
                                                             v
                                                    T020 (docs update)
```

**Legend:**

- T001-T003 can be executed in parallel (all implement phase functions)
- T004 depends on T001-T003 (orchestrator needs phase functions)
- T005-T007 can be executed in parallel (tool installation functions)
- T008-T009 can be executed in parallel (configuration setup)
- T010 depends on T004 (state writer needs orchestrator output)
- T011 depends on T004 (report needs orchestrator output)
- T012 depends on T004, T010, T011 (hook needs all core functions)
- T013 depends on T012 (register hook after creating it)
- T014-T015 can be executed in parallel (both documentation)
- T016-T018 can be executed in parallel (all edge case handlers)
- T019 depends on T013 and T016-T018 (test after everything integrated)
- T020 depends on T019 (update docs after testing confirms it works)

---

## Execution Notes

### Critical Path

**T001 → T002 → T003 → T004 → T011 → T012 → T013 → T019 → T020**

This is the minimum sequence required for basic functionality. Other tasks can be parallelized around this path.

### Parallel Execution Opportunities

| Phase | Parallel Tasks                     |
| ----- | ---------------------------------- |
| 1     | T001, T002, T003 (phase functions) |
| 2     | T005, T006, T007 (tool functions)  |
| 3     | T008, T009 (configuration)         |
| 7     | T014, T015 (documentation)         |
| 8     | T016, T017, T018 (edge cases)      |

### Estimated Effort

| Phase     | Tasks  | Effort                    |
| --------- | ------ | ------------------------- |
| Phase 1   | 4      | ~40 min                   |
| Phase 2   | 3      | ~30 min                   |
| Phase 3   | 2      | ~15 min                   |
| Phase 4   | 1      | ~10 min                   |
| Phase 5   | 1      | ~20 min                   |
| Phase 6   | 2      | ~15 min                   |
| Phase 7   | 2      | ~20 min                   |
| Phase 8   | 3      | ~25 min                   |
| Phase 9   | 2      | ~30 min                   |
| **Total** | **20** | **~205 min (~3.4 hours)** |

### Rollback Checkpoints

**After T004 (Core Script Complete):**

- Assess: Can manually run environment-check.cjs and it returns valid results?
- IF YES → Proceed to tool installation
- IF NO → Debug T001-T004 before continuing

**After T013 (Hook Registered):**

- Assess: Does /start trigger the hook and inject results?
- IF YES → Proceed to documentation and edge cases
- IF NO → Debug T012-T013, check hook registration

**After T019 (Testing Complete):**

- Assess: Does full workflow work in fresh clone scenario?
- IF YES → Update final documentation (T020)
- IF NO → Identify failing component, rollback and fix

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] environment-check.cjs exists and implements all 4 phase functions + orchestrator
2. [ ] install-tools.cjs exists with CodeRabbit and GitHub CLI functions
3. [ ] .claude/config/environment.json exists with proper schema
4. [ ] start-status.json is generated with valid schema matching design.md
5. [ ] user-prompt-start.cjs hook exists and is registered in settings.json
6. [ ] Hook triggers on /start command and injects formatted results
7. [ ] .claude/commands/start.md documents 5-phase workflow with flags
8. [ ] .claude/agents/git-agent.md documents environment integration
9. [ ] Offline mode detection skips network checks gracefully
10. [ ] CI mode detection disables prompts and auto-install
11. [ ] Windows platform skips CodeRabbit with unsupported status
12. [ ] Full /start workflow tested in fresh clone (all phases work)
13. [ ] Terminal output matches design.md format (box chars, colors, fix commands)
14. [ ] start-status.json added to .gitignore
15. [ ] README.md documents /start command with examples and troubleshooting

---
