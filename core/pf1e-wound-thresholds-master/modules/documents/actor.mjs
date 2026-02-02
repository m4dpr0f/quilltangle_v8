export function highlightWoundThresholds(sheet, [html], data) {
    const input = html.querySelector(`.wounds-current-input`);

    const woundTotal = data.system.attributes?.wounds?.max;
    if (woundTotal === undefined) return;

    const woundPercentage = data.system.attributes.wounds.value / woundTotal;

    let state = "healthy";
    if (woundPercentage <= 0) {
        state = "dead";
    } else if (woundPercentage <= 0.5) {
        state = "critical";
    } else if (woundPercentage <= 0.75) {
        state = "wounded";
    } else if (woundPercentage < 1) {
        state = "grazed";
    }

    input?.parentNode?.classList?.add(`wt-${state}`);
}

export function highlightVigorThresholds(sheet, [html], data) {
    const input = html.querySelector(`.vigor-current-input`);
    const state = data.system.attributes?.vigor?.value !== 0 ? "healthy" : "grazed";
    input?.parentNode?.classList?.add(`wt-${state}`);
}

export function toggleWoundThresholds(document, changes, options, userId) {
    const vigorChanged = changes?.system?.attributes?.vigor;
    const woundsChanged = changes?.system?.attributes?.wounds;

    if (!vigorChanged && !woundsChanged) return;

    let conditions = {
        wtGrazed: false,
        wtWounded: false,
        wtCritical: false,
        staggered: false,
        fatigued: null
    }

    if (vigorChanged) {
        const newVigorValue = (vigorChanged.value || (document.system.attributes.vigor.max + vigorChanged.offset));
        if (newVigorValue <= 0) {
            conditions.fatigued = true;
        }
    }

    if (woundsChanged) {
        const newWoundsValue = (woundsChanged.value || (document.system.attributes.wounds.max + woundsChanged.offset));
        const woundsTotal = woundsChanged.total || document.system.attributes.wounds.max;

        const woundPercentage = newWoundsValue / woundsTotal;

        if (woundPercentage <= 0) {
            // Do nothing
        } else if (woundPercentage <= 0.5) {
            conditions.staggered = true;
            conditions.wtCritical = true;
        } else if (woundPercentage <= 0.75) {
            conditions.wtWounded = true;
        } else if (woundPercentage < 1) {
            conditions.wtGrazed = true;
        }
    }

    let conditionsChanged = false;
    for (const [key, value] of Object.entries(conditions)) {
        if (value === null) {
            delete conditions[key];
            continue;
        }

        if (document.system.conditions[key] !== value) {
            conditionsChanged = true;
        } else {
            delete conditions[key];
        }
    }

    if (conditionsChanged) {
        document.setConditions(conditions);
    }
}