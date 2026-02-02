import {useAction, useUnchainedAction} from "../util.mjs";

export function movementHud(ARGON) {
    return class Pathfinder1eMovementHud extends ARGON.MovementHud {
        constructor(props) {
            super(props);
            this.triggerCount = 0;
            this.movedDiagonals = 0;
        }

        get isUnchained() {
            return game.settings.get("pf1", "unchainedActionEconomy");
        }

        get movementMax() {
            let isElevated = this.token?.document.elevation > 0;

            const landSpeed = this.actor?.system.attributes.speed.land.total;
            const flySpeed = this.actor?.system.attributes.speed.fly.total || landSpeed;

            return Math.floor((isElevated ? flySpeed : landSpeed) / 5);
        }

        onTokenUpdate(updates, context) {
            if (updates.x === undefined && updates.y === undefined) return;
            const dimensions = canvas.dimensions.distance;

            const distance = canvas.grid.measurePath([{
                x: this.token.x,
                y: this.token.y
            }, {
                x: updates.x ?? this.token.x,
                y: updates.y ?? this.token.y
            }], {gridSpaces: true});

            let spaces = distance.distance / dimensions;
            const totalDiagonals = this.movedDiagonals + distance.diagonals;
            const newDiagonals = distance.diagonals;

            const diagonalSetting = game.settings.get("core", "gridDiagonals");
            console.log(totalDiagonals, totalDiagonals % 2);
            switch(diagonalSetting) {
                case 4: {
                    // 1/2/1
                    const method = !!(totalDiagonals % 2) === !!context?.isUndo ? Math.ceil : Math.floor;
                    spaces += method(newDiagonals / 2);
                    break;
                }

                case 5:
                    // 2/1/2
                    const method = !!(totalDiagonals % 2) === !!context?.isUndo ? Math.floor : Math.ceil;
                    spaces += method(newDiagonals / 2);
                    break;

                default:
                    break;
            }

            console.log(distance);

            if (context?.isUndo) {
                this.movementUsed -= spaces;
                this.movedDiagonals -= distance.diagonals;
            } else {
                this.movementUsed += spaces;
                this.movedDiagonals += distance.diagonals;
            }
            this.updateMovement();
        }

        updateMovement() {
            super.updateMovement();

            switch (this.triggerCount) {
                case 0:
                    if (this.isUnchained) {
                        if (this.movementUsed > 0) {
                            useUnchainedAction("action")
                            this.triggerCount++;
                        }
                    } else {
                        if (this.movementUsed > 1) {
                            useAction("move");
                            this.triggerCount++;
                        }
                    }

                    break;
                case 1:
                    if (this.movementUsed > this.movementMax) {
                        if (this.isUnchained) useUnchainedAction("action")
                        else useAction("standard");
                        this.triggerCount++;
                    }
                    break;
                case 2:
                    if (this.isUnchained) {
                        if (this.movementUsed > this.movementMax * 2) {
                            useUnchainedAction("action")
                            this.triggerCount++;
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        get visible() {
            return game.combat?.started;
        }

        _onNewRound(combat) {
            super._onNewRound(combat);
            this.triggerCount = 0;
            this.movedDiagonals = 0;
        }

        _onCombatEnd(combat) {
            super._onCombatEnd(combat);
            this.triggerCount = 0;
            this.movedDiagonals = 0;
        }

    }
}