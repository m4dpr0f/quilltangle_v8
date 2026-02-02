export function patchCritDamage(actionUse) {
    const attacks = actionUse.shared.chatAttacks.map((attack) => {
        if (!attack.hasDamage || !attack.hasCritConfirm) return attack;

        const critMultiplier = attack.critConfirm.data.critMult;

        // Remove base damage multipliers for crits
        const damageItems = Math.floor(attack.critDamage.rolls.length / (critMultiplier - 1)) - 1
        const damageRolls = damageItems ? attack.critDamage.rolls.slice(-damageItems) : []

        const baseDamageRoll = new pf1.dice.DamageRoll("" + critMultiplier, attack.rollData, {
            type: "crit",
            damageType: {
                custom: "Wounds"
            }
        })
        baseDamageRoll.evaluate({async: false})
        damageRolls.unshift(baseDamageRoll)
        attack.critDamage.rolls = damageRolls;

        for (let i = 0; i < attack.damageRows.length; i++) {
            attack.damageRows[i].crit = attack.critDamage.rolls[i] || null;
        }
        attack.damageRows = attack.damageRows.filter((row) => row.crit !== null || row.normal !== null)

        attack.critDamage.total = attack.critDamage.rolls.reduce((total, roll) => {
            return total + roll.total
        }, 0)

        return attack
    });

    actionUse.shared.chatAttacks = attacks;
    actionUse.shared.templateData.attacks = attacks;
}