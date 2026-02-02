import {drawerButton} from "../buttons/drawerButton.mjs";
import {ucFirst} from "../../util.mjs";

export function drawerPanel(ARGON) {
    return class Pathfinder1eDrawerPanel extends ARGON.DRAWER.DrawerPanel {
        get title() {
            return `${game.i18n.localize("PF1.Attributes")}, ${game.i18n.localize("PF1.SavingThrowPlural")} & ${game.i18n.localize("PF1.Skills")}`;
        }

        get categories() {
            const DrawerButton = drawerButton(ARGON);

            const actor = this.actor;
            const useBackgroundSkills = game.settings.get("pf1", "allowBackgroundSkills");
            const backgroundSkills = ["art", "lor"];

            return [
                {
                    gridCols: "7fr 2fr",
                    captions: [
                        {
                            label: game.i18n.localize("PF1.Attributes")
                        },
                        {
                            label: game.i18n.localize("PF1.Roll")
                        }
                    ],
                    buttons: ["str", "dex", "con", "int", "wis", "cha"].map(ability =>
                        new DrawerButton([
                            {
                                label: pf1.config.abilities[ability],
                                onClick: () => actor.rollAbilityTest(ability)
                            },
                            {
                                label: actor.system.abilities[ability].total,
                                onClick: () => actor.rollAbilityTest(ability),
                                style: "display: flex; justify-content: flex-end;"
                            }
                        ]))
                },
                {
                    gridCols: "7fr 2fr",
                    captions: [
                        {
                            label: game.i18n.localize("PF1.SavingThrowPlural")
                        },
                        {
                            label: game.i18n.localize("PF1.Roll")
                        }
                    ],
                    buttons: ["fort", "ref", "will"].map(save => new DrawerButton([
                        {
                            label: pf1.config.savingThrows[save],
                            onClick: () => actor.rollSavingThrow(save)
                        },
                        {
                            label: actor.system.attributes.savingThrows[save].total,
                            onClick: () => actor.rollSavingThrow(save),
                            style: "display: flex; justify-content: flex-end;"
                        }
                    ]))
                },
                // TODO: Thin out or remove the skill buttons, they're massive
                {
                    gridCols: "7fr 2fr",
                    captions: [
                        {
                            label: game.i18n.localize("PF1.Skills")
                        },
                        {
                            label: game.i18n.localize("PF1.Roll")
                        }
                    ],
                    buttons: Object.entries(actor.system.skills).map((skillData) => {
                        const [skillId, skill] = skillData;

                        if(!useBackgroundSkills && backgroundSkills.includes(skillId)) return [];

                        let skillButtonGroup = [
                            new DrawerButton([
                                {
                                    label: skill.name || pf1.config.skills[skillId],
                                    onClick: () => actor.rollSkill(skillId)
                                },
                                {
                                    label: skill.mod,
                                    onClick: () => actor.rollSkill(skillId),
                                    style: "display: flex; justify-content: flex-end;"
                                }
                            ])
                        ]

                        if (skill.subSkills) {
                            Object.entries(skill.subSkills).map(subSkillData => {
                                const [subSkillId, subSkill] = subSkillData;

                                skillButtonGroup.push(new DrawerButton([
                                    {
                                        label: '- ' + (subSkill.name || pf1.config.skills[subSkillId]),
                                        onClick: () => actor.rollSkill(`${skillId}.subSkills.${subSkillId}`)
                                    },
                                    {
                                        label: subSkill.mod,
                                        onClick: () => actor.rollSkill(`${skillId}.subSkills.${subSkillId}`),
                                        style: "display: flex; justify-content: flex-end;"
                                    }
                                ]))
                            })
                        }

                        return skillButtonGroup;
                    }).flat(1)
                }
            ]
        }
    }
}