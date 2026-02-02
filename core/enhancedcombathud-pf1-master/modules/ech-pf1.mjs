import {playerPortraitPanel} from "./argon/panels/playerPortraitPanel.mjs";
import {weaponSets} from "./argon/weaponSets.mjs";
import {drawerPanel} from "./argon/panels/drawerPanel.mjs";
import {movementHud} from "./argon/movementHud.mjs";
import {buttonHud} from "./argon/buttonHud.mjs";
import {registerSettings} from "./settings.mjs";
import {panels} from "./argon/panels/panels.mjs";

export const BaseModuleName = "enhancedcombathud";
export const ModuleName = "enhancedcombathud-pf1";

Hooks.on("argonInit", async (CoreHUD) => {
    CoreHUD.definePortraitPanel(playerPortraitPanel(CoreHUD.ARGON));
    CoreHUD.defineDrawerPanel(drawerPanel(CoreHUD.ARGON));
    CoreHUD.defineMainPanels(panels(CoreHUD.ARGON));
    CoreHUD.defineMovementHud(movementHud(CoreHUD.ARGON));
    CoreHUD.defineButtonHud(buttonHud(CoreHUD.ARGON));
    CoreHUD.defineWeaponSets(weaponSets(CoreHUD.ARGON));
    CoreHUD.defineSupportedActorTypes(["character", "npc"]);
})

Hooks.once("init", registerSettings);

export let templates = {
    StatBlock: null
};
Hooks.once("init", () => {
    getTemplate(`modules/${ModuleName}/templates/StatBlocks.hbs`,).then(t => templates.StatBlock = t)
})