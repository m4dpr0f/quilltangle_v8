import {extendToken} from "./canvas/token.mjs";
import {
    highlightVigorThresholds,
    highlightWoundThresholds,
    toggleWoundThresholds
} from "./documents/actor.mjs";
import {registerConditions} from "./registry/conditions.mjs";
import {extendTokenHud} from "./canvas/token-hud.mjs";
// import {patchCritDamage} from "./action-use/action-use.mjs";

export const MODULE_NAME = "pf1e-woundThresholds";

// TODO: Lib-Wrap Token extend?
// Hooks.once("init", () => {
//
// });

Hooks.once("pf1PostInit", () => {
    pf1.canvas.TokenPF = extendToken(pf1.canvas.TokenPF);
    CONFIG.Token.objectClass = pf1.canvas.TokenPF;
    pf1.canvas.TokenHUDPF = extendTokenHud(pf1.canvas.TokenHUDPF);
    CONFIG.Token.hudClass = pf1.canvas.TokenHUDPF;
});

Hooks.on("pf1RegisterConditions", (registry, model) => {
    registerConditions(registry);
})

Hooks.on("preUpdateActor", toggleWoundThresholds)
Hooks.on("renderActorSheetPF", highlightWoundThresholds)
Hooks.on("renderActorSheetPF", highlightVigorThresholds)

// TODO: Reimplement crit patch
// Hooks.on("pf1PreDisplayActionUse", patchCritDamage)