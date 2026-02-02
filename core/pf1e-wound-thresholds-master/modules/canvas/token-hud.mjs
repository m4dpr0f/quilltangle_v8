export function extendTokenHud(TokenHUD) {
    return class WoundThresholdTokenHUD extends TokenHUD {
        activateListeners(html) {
            super.activateListeners(html);
            this.addWTBoxLabels(html[0]);
        }

        _onRender(context, options) {
            super._onRender(context, options);
            this.addWTBoxLabels(this.element);
        }

        addWTBoxLabels(html) {
            for(let i = 1; i <= 2; i++) {
                const name = `bar${i}`;

                let label = null;
                let extraClass = null;
                switch(this.document[name].attribute) {
                    case "attributes.vigor":
                        label = "PF1.Vigor";
                        extraClass = "vigor";
                        break;

                    case "attributes.wounds":
                        label = "PF1.Wounds";
                        extraClass = "wounds";
                        break;

                    case "attributes.hp":
                        label = "PF1.HitPoints";
                        extraClass = "hp";
                        break;
                }

                if(!label) continue;
                const barHtml = html.querySelector(`.${name}`);
                const labelHtml = document.createElement("div");
                labelHtml.classList.add("bar-label");
                labelHtml.innerHTML = game.i18n.localize(label);
                barHtml.appendChild(labelHtml);
                barHtml.classList.add(extraClass);
            }
        }
    }
}