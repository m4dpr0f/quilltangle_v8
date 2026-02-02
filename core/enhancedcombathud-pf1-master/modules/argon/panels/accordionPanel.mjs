let spellAccordionPanelCategories = {
    "primary": {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []},
    "secondary": {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []},
    "tertiary": {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []},
    "spelllike": {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []},
}
Hooks.on("ECHPF1.spellUsed", (item) => {
    const categories = spellAccordionPanelCategories[item.system.spellbook][item.system.level];
    categories.map(category => {
        category.use();
    })
});


export function accordionPanel(ARGON) {
    return class Pathfinder1eAccordionPanel extends ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanel {
        get actionType() {
            return this.parent?.actionType;
        }

        get isUnchained() {
            if (this.parent?.isUnchained !== undefined) {
                return this.parent.isUnchained;
            }

            if (this.parent?.parent?.isUnchained !== undefined) {
                return this.parent.parent.isUnchained
            }
        }

        async toggleDefaults() {
            this._subPanels[0]?.toggle(true)
        }

        hideAll() {
            this._subPanels.forEach(panel => {
                if (panel.element.classList.contains("show")) panel.toggle(false)
            });
        }
    }
}

export function accordionPanelCategory(ARGON) {
    return class Pathfinder1eAccordionPanelCategory extends ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanelCategory {
        constructor(args) {
            super(args);
            this.isAccordionPanelCategory = true;

            if (args.isSpellCategory) {
                spellAccordionPanelCategories[args.spellbookId][args.spellLevel].push(this);
            }
        }

        get isUnchained() {
            if (this.parent?.isUnchained !== undefined) {
                return this.parent.isUnchained;
            }

            if (this.parent?.parent?.isUnchained !== undefined) {
                return this.parent.parent.isUnchained
            }
        }

        get buttonMultipliers() {
            return [2, 3, 4, 5, 6, 7];
        }

        use() {
            this.uses.value--;
            this.setUses();
        }


        toggle(toggle, noTransition = false) {
            const hide = this.element.classList.contains("show");
            if (!hide) {
                this.parent.hideAll();
            }

            super.toggle(toggle, noTransition);
        }
    }
}