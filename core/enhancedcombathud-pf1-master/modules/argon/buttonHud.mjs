export function buttonHud(ARGON) {
    return class Pathfinder1eButtonHud extends ARGON.ButtonHud {
        async _getButtons() {
            return [
                {
                    "label": game.i18n.localize("PF1.Rest"),
                    "icon": "fas fa-bed",
                    "onClick": () => {
                        const ActorRestDialog = pf1.applications.actor.ActorRestDialog;

                        const app = Object.values(this.actor.apps).find((app) => app instanceof ActorRestDialog);
                        if (app) {
                            app.render(true);
                            app.bringToFront();
                        } else new ActorRestDialog({ document: this.actor }).render({ force: true });

                    }
                }
            ];
        }

        get visible() {
            return !game.combat?.started;
        }
    }
}