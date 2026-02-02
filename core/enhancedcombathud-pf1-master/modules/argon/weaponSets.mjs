export function weaponSets(ARGON) {
    return class Pathfinder1eWeaponSets extends ARGON.WeaponSets {
        get weapons() {
            return this.actor.itemTypes.attack;
        }

        async _onSetChange({sets, active}) {
            // let updates = [];
            //
            // const activeWeaponIds = Object.values(sets[active])
            //     .map(weapon => weapon?._id)
            //     .filter(id => id !== null);
            //
            // this.weapons.map(weapon => {
            //     updates.push({
            //         _id: weapon._id,
            //         "system.equipped": activeWeaponIds.includes(weapon._id)
            //     })
            // })
            //
            // await this.actor.updateEmbeddedDocuments("Item", updates);
        }

        async _onDrop(event) {
            try {
                event.preventDefault();
                event.stopPropagation();
                const data = JSON.parse(event.dataTransfer.getData("text/plain"));
                if(data?.type !== "Item") return;

                let item = this.actor.items.get(data.uuid.split(".").pop());
                if(item.type !== 'attack') {
                    const itemLinks = item.system?.links?.children || {};
                    for(let i in itemLinks) {
                        const linkId = itemLinks[i].uuid;
                        item = this.actor.items.get(linkId.split(".").pop());
                        if(item.type === "attack") {
                            break;
                        }
                    }
                    if(item.type !== "attack") {
                        ui.notifications.warn(game.i18n.localize("ECHPF1.Error.CannotAddNonAttackAction"));
                        return;
                    }
                }

                const set = event.currentTarget.dataset.set;
                const slot = event.currentTarget.dataset.slot;
                const sets = this.actor.getFlag("enhancedcombathud", "weaponSets") || {};

                sets[set] = sets[set] || {};
                sets[set][slot] = item.id;

                await this.actor.setFlag("enhancedcombathud", "weaponSets", sets);
                await this.render();
            } catch (error) {
                console.error(error)
            }
        }

        async _getSets() {
            const sets = foundry.utils.mergeObject(await this.getDefaultSets(), foundry.utils.deepClone(this.actor.getFlag("enhancedcombathud", "weaponSets") || {}));

            for (const [set, slots] of Object.entries(sets)) {
                slots.primary = typeof slots.primary === "string" ? await this.actor.items.get(slots.primary) : slots.primary;
                slots.secondary = typeof slots.secondary === "string" ? await this.actor.items.get(slots.secondary) : slots.secondary;
            }
            return sets;
        }

        async getDefaultSets() {
            const attacks = this.actor.itemTypes.attack;

            return {
                1: {
                    primary: attacks[0] || null,
                    secondary: attacks[1] || null
                },
                2: {
                    primary: attacks[2] || null,
                    secondary: attacks[3] || null
                },
                3: {
                    primary: attacks[4] || null,
                    secondary: attacks[5] || null
                },
            }
        }
    }
}