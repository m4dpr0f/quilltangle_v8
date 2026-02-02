import {MODULE_ID} from "../_moduleId.mjs";

export function registerConditions(registry) {
    registry.tracks.push("wounded");

    const modifier = 2;
    const offsets = {
        cl: -2
    };

    registry.register(MODULE_ID, "wtGrazed", {
        name: "PF1WT.WoundThresholdsGrazed",
        texture: "modules/pf1e-wound-thresholds/icons/conditions/wt-grazed.svg",
        mechanics: {
            changes: ["attack", "allSavingThrows", "skills", "allChecks", "ac", "cl"].map(target => ({
                formula: -1 * modifier * (offsets[target] || 1),
                target: target,
                modifier: "penalty"
            })),
        },
        track: "wounded"
    });

    registry.register(MODULE_ID, "wtWounded", {
        name: "PF1WT.WoundThresholdsWounded",
        texture: "modules/pf1e-wound-thresholds/icons/conditions/wt-wounded.svg",
        mechanics: {
            changes: ["attack", "allSavingThrows", "skills", "allChecks", "ac", "cl"].map(target => ({
                formula: -2 * modifier * (offsets[target] || 1),
                target: target,
                modifier: "penalty"
            })),
        },
        track: "wounded"
    })

    registry.register(MODULE_ID, "wtCritical", {
        name: "PF1WT.WoundThresholdsCritical",
        texture: "modules/pf1e-wound-thresholds/icons/conditions/wt-critical.svg",
        mechanics: {
            changes: ["attack", "allSavingThrows", "skills", "allChecks", "ac", "cl"].map(target => ({
                formula: -3 * modifier * (offsets[target] || 1),
                target: target,
                modifier: "penalty"
            })),
        },
        track: "wounded"
    })
}