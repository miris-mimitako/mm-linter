"use strict";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function ensureCustomizationsAllowed(baseOptions, overrideOptions) {
  const customization = baseOptions.customization || {};
  const allowNewLayers = customization.allowNewLayers !== false;
  const allowAllowRules = customization.allowAllowRules !== false;
  const allowDenyRules = customization.allowDenyRules !== false;

  if (!allowDenyRules && Array.isArray(overrideOptions.denyLayers) && overrideOptions.denyLayers.length > 0) {
    throw new Error("Overriding denyLayers is denied by the layer-structure configuration.");
  }

  if (!overrideOptions.layers) {
    return;
  }

  const baseLayers = baseOptions.layers || {};

  for (const [layerName, layerOverride] of Object.entries(overrideOptions.layers)) {
    if (!allowNewLayers && !hasOwn(baseLayers, layerName)) {
      throw new Error(`Adding a new layer is denied by the layer-structure configuration: '${layerName}'.`);
    }

    if (!layerOverride || typeof layerOverride !== "object") {
      continue;
    }

    for (const sectionName of ["directories", "files", "functions"]) {
      const sectionOverride = layerOverride[sectionName];
      if (!sectionOverride || typeof sectionOverride !== "object") {
        continue;
      }

      if (!allowAllowRules && Array.isArray(sectionOverride.allow) && sectionOverride.allow.length > 0) {
        throw new Error(`Overriding ${layerName}.${sectionName}.allow is denied by the layer-structure configuration.`);
      }

      if (!allowDenyRules && Array.isArray(sectionOverride.deny) && sectionOverride.deny.length > 0) {
        throw new Error(`Overriding ${layerName}.${sectionName}.deny is denied by the layer-structure configuration.`);
      }
    }
  }
}

function mergePolicy(basePolicy = {}, overridePolicy = {}) {
  const mergedPolicy = { ...basePolicy };

  for (const key of ["allow", "deny"]) {
    if (hasOwn(overridePolicy, key)) {
      mergedPolicy[key] = clone(overridePolicy[key]);
    }
  }

  return mergedPolicy;
}

function mergeLayer(baseLayer = {}, overrideLayer = {}) {
  const mergedLayer = { ...baseLayer };

  if (hasOwn(overrideLayer, "enabled")) {
    mergedLayer.enabled = overrideLayer.enabled;
  }

  for (const sectionName of ["directories", "files", "functions"]) {
    if (hasOwn(overrideLayer, sectionName)) {
      mergedLayer[sectionName] = mergePolicy(baseLayer[sectionName], overrideLayer[sectionName]);
    }
  }

  return mergedLayer;
}

function defineLayerStructureOptions(baseOptions, overrideOptions = {}) {
  const base = clone(baseOptions || {});
  const override = clone(overrideOptions || {});

  if (base.locked) {
    ensureCustomizationsAllowed(base, override);
  }

  const merged = { ...base, ...override };
  const baseLayers = base.layers || {};
  const overrideLayers = override.layers || {};
  const layerNames = new Set([...Object.keys(baseLayers), ...Object.keys(overrideLayers)]);

  if (layerNames.size > 0) {
    merged.layers = {};

    for (const layerName of layerNames) {
      merged.layers[layerName] = mergeLayer(baseLayers[layerName], overrideLayers[layerName]);
    }
  }

  return merged;
}

module.exports = {
  defineLayerStructureOptions,
};
