export function drawerButton(ARGON) {
    return class Pathfinder1eDrawerButton extends ARGON.DRAWER.DrawerButton {
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