export function splitButton(ARGON) {
    return class Pathfinder1eSplitButton extends ARGON.MAIN.BUTTONS.SplitButton {
        get isValid() {
            return this.button1?.isValid || this.button2?.isValid;
        }

        get actionType() {
            return this.parent?.actionType;
        }

        get colorScheme() {
            return this.parent.colorScheme;
        }

        get isUnchained() {
            if (this.parent?.isUnchained !== undefined) {
                return this.parent.isUnchained;
            }

            if (this.parent?.parent?.isUnchained !== undefined) {
                return this.parent.parent.isUnchained
            }
        }
    }
}