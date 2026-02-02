import {createBuff, ucFirst, useAction, useUnchainedAction} from "../../util.mjs";
import {ModuleName} from "../../ech-pf1.mjs";

export function specialActionButton(ARGON) {
    return class Pathfinder1eSpecialActionButton extends ARGON.MAIN.BUTTONS.ActionButton {
        constructor({parent, type, color}) {
            super();
            this.type = type;
            this._parent = parent;
        }

        get actionType() {
            return this.parent.actionType;
        }

        get label() {
            if (this.replacementItem) {
                return this.replacementItem.name;
            }

            return game.i18n.localize(`ECHPF1.Actions.${ucFirst(this.type)}`);
        }

        get isUnchained() {
            if (this.parent?.isUnchained !== undefined) {
                return this.parent.isUnchained;
            }

            if (this.parent?.parent?.isUnchained !== undefined) {
                return this.parent.parent.isUnchained
            }
        }

        get isValid() {
            return true;
        }

        hasTooltip() {
            return true;
        }


        get actionCost() {
            if (!this.isUnchained) {
                return 1;
            }

            switch (this.type) {
                case "dirtyTrick":
                case "reposition":
                case "drag":
                case "grapple":
                case "totalDefense":
                case "steal":
                    return 2;

                default:
                    return 1;
            }
        }

        async getTooltipData() {
            if(this.type === "none") {
                return null;
            }

            let subtitle = null;
            switch (this.type) {
                case "bullRush":
                case "dirtyTrick":
                case "disarm":
                case "drag":
                case "overrun":
                case "steal":
                case "grapple":
                case "reposition":
                case "sunder":
                case "trip":
                    subtitle = game.i18n.localize("ECHPF1.CombatManeuver");
                    break;
            }

            return {
                title: this.label,
                description: await TextEditor.enrichHTML(game.i18n.localize(`ECHPF1.ActionDescriptions.${ucFirst(this.type)}`)),
                subtitle,
                details: null,
                properties: null,
                propertiesLabel: null,
                footerText: null
            }
        }

        get icon() {
            if (this.replacementItem?.img) {
                return this.replacementItem.img;
            }

            switch (this.type) {
                case "feint":
                    return `modules/${ModuleName}/icons/return-arrow.svg`;
                case "bullRush":
                    return `modules/${ModuleName}/icons/bull.svg`;
                case "dirtyTrick":
                    return `modules/${ModuleName}/icons/cloak-dagger.svg`;
                case "disarm":
                    return `modules/${ModuleName}/icons/drop-weapon.svg`;
                case "drag":
                    return `modules/${ModuleName}/icons/pull.svg`;
                case "overrun":
                    return `modules/${ModuleName}/icons/giant.svg`;
                case "steal":
                    return `modules/${ModuleName}/icons/snatch.svg`;
                case "grapple":
                    return `modules/${ModuleName}/icons/grab.svg`;
                case "reposition":
                    return `modules/${ModuleName}/icons/move.svg`;
                case "sunder":
                    return `modules/${ModuleName}/icons/hammer-break.svg`;
                case "trip":
                    return `modules/${ModuleName}/icons/falling.svg`;
                case "dropProne":
                    return `modules/${ModuleName}/icons/save-arrow.svg`;
                case "drawSheathe":
                    return `modules/${ModuleName}/icons/switch-weapon.svg`;
                case "standUp":
                    return `modules/${ModuleName}/icons/up-card.svg`;
                case "withdraw":
                    return `modules/${ModuleName}/icons/exit-door.svg`;
                case "coupDeGrace":
                    return `modules/${ModuleName}/icons/backstab.svg`;
                case "totalDefense":
                    return `modules/${ModuleName}/icons/shield.svg`;
                case "fightingDefensively":
                    return `modules/${ModuleName}/icons/shield-bash.svg`;
                case "dropItem":
                case "dropWeapon":
                    return `modules/${ModuleName}/icons/drop-weapon.svg`;
                case "aidAnotherAttack":
                    return `modules/${ModuleName}/icons/sword-clash.svg`;
                case "aidAnotherDefense":
                    return `modules/${ModuleName}/icons/shield-bash.svg`;
            }
        }

        async _onLeftClick(event) {
            switch (this.type) {
                case "feint":
                    await this.actor.rollSkill("blf");
                    break;

                case "bullRush":
                case "dirtyTrick":
                case "disarm":
                case "drag":
                case "overrun":
                case "steal":
                case "grapple":
                case "reposition":
                case "sunder":
                case "trip":
                    await this.actor.rollCMB({
                        cmbType: this.type
                    });
                    break;

                case "dropProne":
                    await this.actor.setConditions({'prone': true})
                    break;

                case "standUp":
                    await this.actor.setConditions({'prone': false})
                    break;

                case "totalDefense":
                case "fightingDefensively":
                    let buff = await this.actor.getItemByTag(this.type);
                    if (!buff) {
                        buff = await createBuff(this.actor, this.type);
                    }
                    await buff?.update({
                        "system.active": true
                    });
                    break;
            }

            if (this.isUnchained) {
                useUnchainedAction(this.actionType, this.actionCost);
            } else {
                useAction(this.actionType);
            }
        }

        get colorScheme() {
            return this.parent.colorScheme;
        }

        async render(...args) {
            await super.render(...args);

            if (this.item?.flags[ModuleName]?.specialaction) {
                switch (this.colorScheme) {
                    case 1:
                        this.element.style.backgroundColor = "var(--ech-bonusAction-base-background)";
                        break;
                    case 2:
                        this.element.style.backgroundColor = "var(--ech-freeAction-base-background)";
                        break;
                    case 3:
                        this.element.style.backgroundColor = "var(--ech-reaction-base-background)";
                        break;
                    case 0:
                    default:
                        this.element.style.backgroundColor = "var(--ech-mainAction-base-background)";
                        break;
                }
            }
        }
    }
}