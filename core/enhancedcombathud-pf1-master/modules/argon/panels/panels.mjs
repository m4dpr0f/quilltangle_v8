import {BaseModuleName, ModuleName} from "../../ech-pf1.mjs";
import {getUsedSpellBookIds, ucFirst} from "../../util.mjs";
import {
    buttonPanelActionButton,
    buttonPanelItemButton, spellbookButtonPanelActionButton,
    spellButtonPanelActionButton
} from "../buttons/buttonPanelButton.mjs";
import {splitButton} from "../buttons/splitButton.mjs";
import {specialActionButton} from "../buttons/specialActionButton.mjs";
import {itemButton} from "../buttons/itemButton.mjs";

export function panels(ARGON) {
    const isUnchainedActionEconomy = game.settings.get("pf1", "unchainedActionEconomy");

    let panels = [];
    if (isUnchainedActionEconomy) {
        panels = [
            unchainedActionPanel(ARGON),
            reactionActionPanel(ARGON),
            freeActionPanel(ARGON),
        ]
    } else {
        panels = [
            standardActionPanel(ARGON),
            movementActionPanel(ARGON),
            swiftActionPanel(ARGON),
            fullActionPanel(ARGON),
            freeActionPanel(ARGON),
        ]
    }

    return panels.concat([
        ARGON.PREFAB.PassTurnPanel,
        ARGON.PREFAB.MacroPanel
    ]).filter(panel => {
        switch (panel.name) {
            case "PassTurnPanel":
                break;

            default:
                if (!game.settings.get(ModuleName, `Show${panel.name.replace("Pathfinder1e", "")}`)) {
                    return false;
                }
        }

        return true;
    });
}

function actionPanel(ARGON) {
    return class Pathfinder1eActionPanel extends ARGON.MAIN.ActionPanel {
        get template() {
            return `modules/${BaseModuleName}/templates/partials/ActionPanel.hbs`;
        }

        get maxActions() {
            return 1;
        }

        get currentActions() {
            return this.isActionUsed ? 0 : 1;
        }

        get label() {
            return game.i18n.localize(`ECHPF1.ActionTypes.${ucFirst(this.actionType)}`);
        }

        get actionType() {
            return "none";
        }

        get isUnchained() {
            return false;
        }

        get hasMultipleSpellbooks() {
            return getUsedSpellBookIds(this.actor).length > 1;
        }

        _onNewRound(combat) {
            this.isActionUsed = false;
            this.updateActionUse();
        }

        async _getButtons() {
            let buttons = [];


            return buttons.filter(button => button.isValid);
        }


        get weapons() {
            return this.actor.items.filter(item => item.type === "weapon");
        }

        get equippedWeapons() {
            return this.weapons.filter(weapon => weapon.system.equipped);
        }
    }
}

function standardActionPanel(ARGON) {
    return class Pathfinder1eStandardActionPanel extends actionPanel(ARGON) {

        get actionType() {
            return "standard";
        }

        get colorScheme() {
            return 0;
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const ButtonPanelActionButton = buttonPanelActionButton(ARGON);
            const SpecialActionButton = specialActionButton(ARGON);
            const ItemButton = itemButton(ARGON);
            const SplitButton = splitButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);

            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: true}));
            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: false}));

            buttons.push(new SplitButton(
                new ButtonPanelActionButton({parent: this, type: "maneuver"}),
                new SpecialActionButton({parent: this, type: "feint"})
            ))

            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "totalDefense"}),
                new ButtonPanelActionButton({parent: this, type: "aidAnother"}),
            ))

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }
    }
}

function movementActionPanel(ARGON) {
    return class Pathfinder1eMovementActionPanel extends actionPanel(ARGON) {
        get actionType() {
            return "move";
        }

        get colorScheme() {
            return 1;
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SplitButton = splitButton(ARGON);
            const SpecialActionButton = specialActionButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "drawSheathe"}),
                new SpecialActionButton({parent: this, type: "standUp"}),
            ))

            buttons.push(new SpellButtonPanelActionButton({parent: this}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }
    }
}

function swiftActionPanel(ARGON) {
    return class Pathfinder1eSwiftActionPanel extends actionPanel(ARGON) {
        get actionType() {
            return "swift";
        }

        get colorScheme() {
            return 2;
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);


            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }
    }
}

function fullActionPanel(ARGON) {
    return class Pathfinder1eFullActionPanel extends actionPanel(ARGON) {
        get actionType() {
            return "full";
        }

        get colorScheme() {
            return 0;
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SpecialActionButton = specialActionButton(ARGON);
            const SplitButton = splitButton(ARGON);
            const ItemButton = itemButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);

            if (game.settings.get(ModuleName, `ShowWeaponsInFullPanel`)) {
                buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: true}));
                buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: false}));
            }

            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "coupDeGrace"}),
                new SpecialActionButton({parent: this, type: "withdraw"}),
            ))

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }
    }
}

function freeActionPanel(ARGON) {
    return class Pathfinder1eFreeActionPanel extends actionPanel(ARGON) {
        get maxActions() {
            return 0;
        }

        get currentActions() {
            return 0;
        }

        get colorScheme() {
            return 3;
        }

        get actionType() {
            return "free";
        }

        get isUnchained() {
            return game.settings.get("pf1", "unchainedActionEconomy");
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SpecialActionButton = specialActionButton(ARGON);
            const SplitButton = splitButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);

            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "fightingDefensively"}),
                new SpecialActionButton({parent: this, type: "dropItem"}),
            ))
            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "dropProne"}),
                new SpecialActionButton({parent: this, type: "none"}),
            ))

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }
    }
}

function unchainedActionPanel(ARGON) {

    return class Pathfinder1eUnchainedActionPanel extends actionPanel(ARGON) {
        constructor() {
            super();
            this.actionsUsed = 0;
        }

        get maxActions() {
            return game.settings.get(ModuleName, "UnchainedActions");
        }

        get currentActions() {
            return Math.max(0, this.maxActions - this.actionsUsed);
        }

        _onNewRound(combat) {
            this.actionsUsed = 0;
            this.updateActionUse();
        }

        get actionType() {
            return "action";
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);
            const ItemButton = itemButton(ARGON);
            const ButtonPanelActionButton = buttonPanelActionButton(ARGON);
            const SpecialActionButton = specialActionButton(ARGON);
            const SplitButton = splitButton(ARGON);

            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: true}));
            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: false}));

            buttons.push(new SplitButton(
                new ButtonPanelActionButton({parent: this, type: "maneuver"}),
                new SpecialActionButton({parent: this, type: "feint"})
            ))

            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "totalDefense"}),
                new ButtonPanelActionButton({parent: this, type: "aidAnother"}),
            ))

            buttons.push(new SplitButton(
                new SpecialActionButton({parent: this, type: "drawSheathe"}),
                new SpecialActionButton({parent: this, type: "standUp"}),
            ))

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }

        get isUnchained() {
            return true;
        }
    }
}

function reactionActionPanel(ARGON) {
    return class Pathfinder1eReactionActionPanel extends actionPanel(ARGON) {

        get actionType() {
            return "reaction";
        }

        async _getButtons() {
            let buttons = [];

            const ButtonPanelItemButton = buttonPanelItemButton(ARGON);
            const SpellButtonPanelActionButton = spellButtonPanelActionButton(ARGON);
            const SpellbookButtonPanelItemButton = spellbookButtonPanelActionButton(ARGON);
            const ItemButton = itemButton(ARGON);

            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: true}));
            buttons.push(new ItemButton({item: null, parent: this, isWeaponSet: true, isPrimary: false}));

            if (this.hasMultipleSpellbooks) {
                buttons.push(new SpellButtonPanelActionButton({parent: this}));
            } else {
                buttons.push(new SpellbookButtonPanelItemButton({
                    parent: this,
                    spellbookId: getUsedSpellBookIds(this.actor)[0]
                }));
            }

            buttons.push(new ButtonPanelItemButton({parent: this, type: "feat"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "equipment"}));
            buttons.push(new ButtonPanelItemButton({parent: this, type: "consumable"}));

            return buttons.filter(button => button.isValid);
        }

        get isUnchained() {
            return true;
        }
    }
}