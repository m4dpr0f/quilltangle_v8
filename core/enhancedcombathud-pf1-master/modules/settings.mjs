import {ModuleName} from "./ech-pf1.mjs";

export function registerSettings() {
    game.settings.register(ModuleName, "ShowActionReachOnCanvas", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionReachOnCanvas.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionReachOnCanvas.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowStandardActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelStandard.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelStandard.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowMovementActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelMove.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelMove.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowSwiftActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelSwift.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelSwift.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowFullActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelFull.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelFull.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowWeaponsInFullPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowWeaponsInFullPanel.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowWeaponsInFullPanel.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowFreeActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelFree.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowActionPanelFree.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowMacroPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowMacroPanel.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowMacroPanel.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        requiresReload : true
    });

    game.settings.register(ModuleName, "UnchainedActions", {
        name: game.i18n.localize(`ECHPF1.Settings.UnchainedActions.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.UnchainedActions.desc`),
        scope: "world",
        config: true,
        type: Number,
        default: 3,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowUnchainedActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowUnchainedActionPanel.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowUnchainedActionPanel.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });

    game.settings.register(ModuleName, "ShowReactionActionPanel", {
        name: game.i18n.localize(`ECHPF1.Settings.ShowReactionActionPanel.name`),
        hint: game.i18n.localize(`ECHPF1.Settings.ShowReactionActionPanel.desc`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload : true
    });
}