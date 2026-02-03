'use strict';

const fs = require('fs');
const path = require('path');

// Reserved directory names that cannot be used as spec names
const RESERVED_NAMES = ['node_modules', 'dist', 'build'];

// Maximum lengths for validation
const MAX_SEGMENT_LENGTH = 50;
const MAX_PATH_LENGTH = 200;

// Marker files for type detection
const MARKER_FILES = {
  project: 'project.md',
  feature: 'feature.md',
  spec: ['requirements.md', 'design.md', 'tasks.md', 'spec.json']
};

/**
 * Validates and normalizes a spec name to kebab-case format.
 *
 * @param {string} name - The spec name to validate and normalize
 * @returns {string} The normalized spec name
 * @throws {Error} If the name is invalid or violates constraints
 */
function validateAndNormalizeName(name) {
  // Check for null/undefined/non-string input
  if (name === null || name === undefined) {
    throw new TypeError('Spec name cannot be null or undefined.');
  }

  if (typeof name !== 'string') {
    throw new TypeError('Spec name must be a string.');
  }

  // Check for empty string first
  if (name.trim() === '') {
    throw new Error('Spec name cannot be empty after normalization.');
  }

  // Normalization: collapse multiple hyphens and remove leading/trailing hyphens
  const normalized = name
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if empty after normalization
  if (!normalized) {
    throw new Error('Spec name cannot be empty after normalization.');
  }

  // Check for reserved names AFTER normalization (case-insensitive)
  // This check happens before character validation to provide a more specific error message
  // This prevents bypass via names like "--node-modules--" or "Node-Modules"
  if (RESERVED_NAMES.includes(normalized.toLowerCase())) {
    throw new Error(
      `Reserved spec name '${name}'. Reserved names: ${RESERVED_NAMES.join(', ')}`
    );
  }

  // Character validation - must match kebab-case pattern (no forward slash allowed)
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(
      `Invalid spec name '${name}'. Use lowercase-kebab-case format. Example: 'my-feature-name'`
    );
  }

  // Length validation - check total path length first, then segment length
  if (normalized.length > MAX_PATH_LENGTH) {
    throw new Error(
      `Path '${normalized}' exceeds maximum length of ${MAX_PATH_LENGTH} characters.`
    );
  }

  if (normalized.length > MAX_SEGMENT_LENGTH) {
    throw new Error(
      `Spec name '${normalized}' exceeds maximum length of ${MAX_SEGMENT_LENGTH} characters.`
    );
  }

  return normalized;
}

/**
 * Normalizes a path to absolute form with trailing separator.
 *
 * @param {string} p - The path to normalize
 * @returns {string} The normalized absolute path with trailing separator
 */
function normalizePath(p) {
  const resolved = path.resolve(p);
  return resolved.endsWith(path.sep) ? resolved : resolved + path.sep;
}

/**
 * Resolves a spec name to its absolute directory path.
 *
 * @param {string} name - The spec name to resolve
 * @param {string} [levelHint] - Optional hint for the directory level
 * @returns {{path: string, type: string, name: string}} Resolved spec information
 * @throws {Error} If spec not found or ambiguous matches exist
 */
function resolveSpecPath(name, levelHint, options = {}) {
  // Validate and normalize the name
  const normalizedName = validateAndNormalizeName(name);

  // Determine specs directory
  const specsDir = options.specsDir || path.resolve(process.cwd(), 'specs');

  // Collect all matches
  const matches = [];

  // Stage 1: Check specs/{name}/ directory with marker files
  const directPath = path.join(specsDir, normalizedName);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    // Check for at least one spec marker file
    const hasMarker = MARKER_FILES.spec.some(markerFile =>
      fs.existsSync(path.join(directPath, markerFile))
    );
    if (hasMarker) {
      matches.push(directPath);
    }
  }

  // Stage 2: Scan specs/*/specs.json (plural - project-level manifest)
  if (fs.existsSync(specsDir)) {
    const topLevelDirs = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of topLevelDirs) {
      const specsJsonPath = path.join(specsDir, dir, 'specs.json');
      if (fs.existsSync(specsJsonPath)) {
        try {
          const content = fs.readFileSync(specsJsonPath, 'utf8');
          const json = JSON.parse(content);
          if (json.specs && Array.isArray(json.specs)) {
            const hasMatch = json.specs.some(spec => spec.id === normalizedName);
            if (hasMatch) {
              const matchPath = path.join(specsDir, dir);
              if (!matches.includes(matchPath)) {
                matches.push(matchPath);
              }
            }
          }
        } catch (e) {
          // Warn about malformed JSON but don't block resolution
          if (e instanceof SyntaxError) {
            console.warn(`Warning: Malformed JSON in ${specsJsonPath}: ${e.message}`);
          }
        }
      }
    }

    // Stage 3: Scan specs/*/*/specs.json (plural - nested project-level manifest)
    for (const dir of topLevelDirs) {
      const subDir = path.join(specsDir, dir);
      if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
        const subDirs = fs.readdirSync(subDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const subSubDir of subDirs) {
          const specsJsonPath = path.join(subDir, subSubDir, 'specs.json');
          if (fs.existsSync(specsJsonPath)) {
            try {
              const content = fs.readFileSync(specsJsonPath, 'utf8');
              const json = JSON.parse(content);
              if (json.specs && Array.isArray(json.specs)) {
                const hasMatch = json.specs.some(spec => spec.id === normalizedName);
                if (hasMatch) {
                  const matchPath = path.join(subDir, subSubDir);
                  if (!matches.includes(matchPath)) {
                    matches.push(matchPath);
                  }
                }
              }
            } catch (e) {
              // Warn about malformed JSON but don't block resolution
              if (e instanceof SyntaxError) {
                console.warn(`Warning: Malformed JSON in ${specsJsonPath}: ${e.message}`);
              }
            }
          }
        }
      }
    }

    // Stage 4: Scan specs/*/features.json
    for (const dir of topLevelDirs) {
      const featuresJsonPath = path.join(specsDir, dir, 'features.json');
      if (fs.existsSync(featuresJsonPath)) {
        try {
          const content = fs.readFileSync(featuresJsonPath, 'utf8');
          const json = JSON.parse(content);
          if (json.features && Array.isArray(json.features)) {
            const hasMatch = json.features.some(feature => feature.id === normalizedName);
            if (hasMatch) {
              const matchPath = path.join(specsDir, dir);
              if (!matches.includes(matchPath)) {
                matches.push(matchPath);
              }
            }
          }
        } catch (e) {
          // Warn about malformed JSON but don't block resolution
          if (e instanceof SyntaxError) {
            console.warn(`Warning: Malformed JSON in ${featuresJsonPath}: ${e.message}`);
          }
        }
      }
    }
  }

  // Check for ambiguity
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous spec name '${normalizedName}'. Multiple matches found:\n` +
      matches.map(m => `  - ${m}`).join('\n')
    );
  }

  // Check for not found
  if (matches.length === 0) {
    throw new Error(`Spec '${normalizedName}' not found.`);
  }

  // Detect type and return
  const resolvedPath = matches[0];
  const type = detectDirectoryType(resolvedPath);

  return {
    path: normalizePath(resolvedPath),
    type,
    name: normalizedName
  };
}

/**
 * Detects the type of a spec directory based on marker files.
 *
 * @param {string} dirPath - The directory path to check
 * @returns {string} The directory type: 'project', 'feature', or 'spec'
 */
function detectDirectoryType(dirPath) {
  // Check for project marker
  if (fs.existsSync(path.join(dirPath, MARKER_FILES.project))) {
    return 'project';
  }

  // Check for feature marker
  if (fs.existsSync(path.join(dirPath, MARKER_FILES.feature))) {
    return 'feature';
  }

  // Check for spec markers
  for (const markerFile of MARKER_FILES.spec) {
    if (fs.existsSync(path.join(dirPath, markerFile))) {
      return 'spec';
    }
  }

  // Default to spec
  return 'spec';
}

module.exports = {
  validateAndNormalizeName,
  resolveSpecPath,
  detectDirectoryType
};
