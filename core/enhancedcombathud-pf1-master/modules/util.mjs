export function ucFirst(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

export function unique(array) {
    return array.filter((value, index, self) => self.indexOf(value) === index);
}

export function getUsedSpellBookIds(actor) {
    const spellBooks = actor.system.attributes.spells.spellbooks;
    let usedSpellbookIds = []
    for(let spellbookId in spellBooks) {
        const spellBook = spellBooks[spellbookId]
        if(spellBook.inUse) {
            usedSpellbookIds.push(spellbookId)
        }
    }
    return usedSpellbookIds
}

export function useUnchainedAction(actionType, actionCost = 1) {
    let panels = {}
    for (const panel of ui.ARGON.components.main) {
        panels[panel.actionType] = panel;
    }

    switch (actionType) {
        case "action":
            panels.action.actionsUsed += actionCost;
            panels.action.updateActionUse();
            break;

        case "reaction":
            if (!panels.reaction?.isActionUsed) {
                panels.reaction.isActionUsed = true;
                panels.reaction.updateActionUse();
            }
            break;
    }

}

export function useAction(actionType, nest = true) {
    let panels = {}
    for (const panel of ui.ARGON.components.main) {
        panels[panel.actionType] = panel;
    }

    switch (actionType) {
        case "standard":
            if (!panels.standard?.isActionUsed) {
                panels.standard.isActionUsed = true;
                panels.standard.updateActionUse();
                if (nest) useAction("full", false);
            }
            break;
        case "move":
            if (!panels.move?.isActionUsed) {
                panels.move.isActionUsed = true;
                panels.move.updateActionUse();
                if (nest) useAction("full", false);
            } else {
                useAction("standard", false)
            }
            break;
        case "swift":
            if (!panels.swift?.isActionUsed) {
                panels.swift.isActionUsed = true;
                panels.swift.updateActionUse();
            }
            break;
        case "full":
            if (!panels.full?.isActionUsed) {
                panels.full.isActionUsed = true;
                panels.full.updateActionUse();
                if (nest) {
                    useAction("move", false)
                    useAction("standard", false)
                }
            }
            break;
    }
}

export async function createBuff(actor, buffId) {
    const buffs = {
        totalDefense: {
            "name": game.i18n.localize("ECHPF1.Buffs.Names.TotalDefense"),
            "type": "buff",
            "img": "systems/pf1/icons/feats/shield-master.jpg",
            "system": {
                "description": {
                    "value": game.i18n.localize("ECHPF1.Buffs.Descriptions.TotalDefense"),
                    "unidentified": ""
                },
                "tags": [],
                "changes": [{
                    "_id": "ntuwfvbl",
                    "formula": "ifThenElse(gte(@skills.acr.rank, 3), 6, 4)",
                    "operator": "add",
                    "subTarget": "ac",
                    "modifier": "dodge",
                    "priority": 0,
                    "value": 0,
                    "target": "ac"
                }],
                "changeFlags": {
                    "loseDexToAC": false,
                    "noEncumbrance": false,
                    "mediumArmorFullSpeed": false,
                    "heavyArmorFullSpeed": false
                },
                "contextNotes": [{
                    "text": game.i18n.localize("ECHPF1.Buffs.ContextNotes.TotalDefense1"),
                    "target": "misc",
                    "subTarget": "ac"
                }, {
                    "text": game.i18n.localize("ECHPF1.Buffs.ContextNotes.TotalDefense2"),
                    "target": "attacks",
                    "subTarget": "attack"
                }],
                "links": {"children": []},
                "tag": "totalDefense",
                "useCustomTag": true,
                "flags": {"boolean": {}, "dictionary": {}},
                "scriptCalls": [],
                "subType": "temp",
                "active": false,
                "level": null,
                "duration": {"value": "1", "units": "round"},
                "hideFromToken": false,
                "uses": {"value": 0, "max": 0, "per": ""}
            },
            "effects": [],
        },
        fightingDefensively: {
            "name": game.i18n.localize("ECHPF1.Buffs.Names.FightingDefensively"),
            "type": "buff",
            "img": "systems/pf1/icons/feats/shield-master.jpg",
            "system": {
                "description": {
                    "value": game.i18n.localize("ECHPF1.Buffs.Descriptions.FightingDefensively"),
                    "unidentified": ""
                },
                "tags": [],
                "changes": [{
                    "_id": "zmpj4gpd",
                    "formula": "ifThenElse(gte(@skills.acr.rank, 3), 3, 2)",
                    "subTarget": "ac",
                    "modifier": "dodge",
                    "operator": "add",
                    "priority": null
                }, {
                    "_id": "osyl628w",
                    "formula": "-4",
                    "subTarget": "attack",
                    "modifier": "untyped",
                    "operator": "add",
                    "priority": null
                }],
                "changeFlags": {
                    "loseDexToAC": false,
                    "noEncumbrance": false,
                    "mediumArmorFullSpeed": false,
                    "heavyArmorFullSpeed": false
                },
                "contextNotes": [],
                "links": {"children": []},
                "tag": "fightingDefensively",
                "useCustomTag": true,
                "flags": {"boolean": {}, "dictionary": {}},
                "scriptCalls": [],
                "subType": "temp",
                "active": false,
                "level": null,
                "duration": {"value": "1", "units": "round"},
                "hideFromToken": false,
                "uses": {"per": ""}
            },
            "effects": []
        }
    }

    const buff = buffs[buffId];
    if (!buff) {
        return null;
    }
    await actor.createEmbeddedDocuments("Item", [buff]);
    return actor.getItemByTag(buffId);
}

export function renderAttackString(action) {
    const rollData = action.getRollData();

    return action.getAttacks({ full: true, resolve: true, conditionals: true, bonuses: true, rollData: rollData })
        .map((attack) => {
        const value = Math.floor(attack.bonus)
        return (value < 0 ? "-" : "+") + value
    }).join('/');
}

export function renderCriticalChanceString(action) {
    const critRange = action.ability.critRange;

    return (critRange === 20 ? "20" : `${critRange}-20`) + 'x' + (action.ability.critMult || `2`)
}

export async function renderSaveString(action, rollData) {
    const saveType = game.i18n.localize(`PF1.SavingThrow${ucFirst(action.save.type)}`);

    let saveDC = action.save.dc || 0;
    if (action.item.type === "spell") {
        saveDC += action.item.spellbook.baseDCFormula;
    }

    saveDC = RollPF.safeRollSync(saveDC, rollData, {}, {}).total;

    const threshold = game.i18n.localize("PF1.DCThreshold").replace('{threshold}', saveDC);

    return `${saveType} ${threshold}`;
}

export function renderTemplateString(action) {
    const targetType = CONFIG.MeasuredTemplate.types[action.measureTemplate.type];
    const distance = pf1.utils.convertDistance(action.measureTemplate.size);
    return `${targetType} ${distance[0]} ${distance[1]}`;
}