import {extendHexAbilityTemplate} from "./canvas/ability-template.mjs";
import {extendHexBorders} from "./canvas/grid.mjs";

Hooks.once("init", () => {
    extendHexBorders();
});

Hooks.on("pf1PostInit", () => {
    pf1.canvas.AbilityTemplate = extendHexAbilityTemplate(pf1.canvas.AbilityTemplate);

    pf1.config.tokenSizes = Object.assign(pf1.config.tokenSizes, {
        col: {
            w: 5,
            h: 5,
            scale: 1
        },
        lg: {
            scale: 0.8,
            w: 2,
            h: 2
        },
        grg: {
            scale: 0.9,
            w: 4,
            h: 4
        }
    })
});