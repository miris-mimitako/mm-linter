"use strict";

const path = require("path");

const DEFAULT_ROOT_DIRS = ["src"];

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function getRootDirs(options) {
  return options.rootDirs && options.rootDirs.length > 0 ? options.rootDirs : DEFAULT_ROOT_DIRS;
}

function getLayerNames(options) {
  return Object.keys(options.layers || {});
}

function getLayerMatchFromFilename(filename, options) {
  if (!filename || filename === "<input>") {
    return null;
  }

  const normalizedFilename = normalizePath(filename);
  const segments = normalizedFilename.split("/").filter(Boolean);
  const rootDirs = getRootDirs(options);
  const layerNames = getLayerNames(options);

  for (let index = 0; index < segments.length; index += 1) {
    if (!rootDirs.includes(segments[index])) {
      continue;
    }

    const layerName = segments[index + 1];
    if (!layerNames.includes(layerName)) {
      continue;
    }

    return {
      filename: normalizedFilename,
      layerName,
      directories: segments.slice(index + 2, -1),
      fileName: segments[segments.length - 1],
    };
  }

  return null;
}

function getImportLayerMatch(sourceValue, filename, options) {
  if (!sourceValue) {
    return null;
  }

  const normalizedFilename = normalizePath(filename);
  const rootDirs = getRootDirs(options);
  const layerNames = getLayerNames(options);
  const aliases = Array.isArray(options.aliases) ? options.aliases : [];

  if (sourceValue.startsWith(".")) {
    const resolved = normalizePath(path.posix.normalize(path.posix.join(path.posix.dirname(normalizedFilename), sourceValue)));
    return getLayerMatchFromFilename(resolved, options);
  }

  const normalizedSource = normalizePath(sourceValue).replace(/^\.\//, "");
  const sourceSegments = normalizedSource.split("/").filter(Boolean);

  for (const alias of aliases) {
    if (normalizedSource === alias) {
      return null;
    }

    if (normalizedSource.startsWith(`${alias}/`)) {
      const aliasedSource = normalizedSource.slice(alias.length + 1);
      return getLayerMatchFromFilename(`/${rootDirs[0]}/${aliasedSource}`, options);
    }
  }

  if (rootDirs.includes(sourceSegments[0])) {
    return getLayerMatchFromFilename(`/${normalizedSource}`, options);
  }

  if (layerNames.includes(sourceSegments[0])) {
    return getLayerMatchFromFilename(`/${rootDirs[0]}/${normalizedSource}`, options);
  }

  return null;
}

module.exports = {
  DEFAULT_ROOT_DIRS,
  getImportLayerMatch,
  getLayerMatchFromFilename,
  normalizePath,
};
