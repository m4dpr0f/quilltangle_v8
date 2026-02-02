function throttle(callback, delay) {
    let timeoutId = -1;
    return () => {
        if (timeoutId <= 0) {
            timeoutId = setTimeout(() => {
                timeoutId = -1;
                callback();
            }, delay);
        }
        return timeoutId;
    };
}

function isHexGrid(gridType) {
    const hexGridTypes = [
        CONST.GRID_TYPES.HEXODDR,
        CONST.GRID_TYPES.HEXEVENR,
        CONST.GRID_TYPES.HEXODDQ,
        CONST.GRID_TYPES.HEXEVENQ,
    ];

    return hexGridTypes.includes(gridType);
}

function getBaseDirection(gridType) {
    switch(gridType) {
        case CONST.GRID_TYPES.HEXODDR:
        case CONST.GRID_TYPES.HEXEVENR:
            return 30;

        case CONST.GRID_TYPES.HEXODDQ:
        case CONST.GRID_TYPES.HEXEVENQ:
            return 0;

        default:
            return 0;
    }
}

export function extendHexAbilityTemplate(AbilityTemplate) {
    return class HexAbilityTemplate extends AbilityTemplate {
        static fromData(data) {
            const type = data.type;
            const distance = data.distance;
            const flags = data.flags;
            if (!type) return null;
            if (!distance) return null;
            if (!canvas.scene) return null;
            if (!["cone", "circle", "rect", "ray"].includes(type)) return null;

            // Prepare template data
            const templateData = {
                t: type,
                distance: distance || 5,
                direction: getBaseDirection(canvas.grid.type),
                x: 0,
                y: 0,
                flags,
                fillColor: data.color ? data.color : game.user.color,
                texture: data.texture ? data.texture : null,
                _id: foundry.utils.randomID(16),
            };

            // Additional type-specific data
            switch (type) {
                case "cone":
                    if (game.settings.get("pf1", "measureStyle") === true)
                        templateData.angle = isHexGrid(canvas.grid.type) ? 60 : CONFIG.MeasuredTemplate.defaults.angle;
                    else templateData.angle = CONFIG.MeasuredTemplate.defaults.originalAngle;
                    break;
                case "rect":
                    templateData.distance = Math.sqrt(Math.pow(distance, 2) + Math.pow(distance, 2));
                    templateData.direction = 45;
                    break;
                case "ray":
                    templateData.width = CONFIG.MeasuredTemplate.defaults.width;
                    if(isHexGrid(canvas.grid.type)) {
                        templateData.direction += 30;
                    }
                    break;
                default:
                    break;
            }

            // Return the template constructed from the item data
            const cls = CONFIG.MeasuredTemplate.documentClass;
            const template = new cls(templateData, { parent: canvas.scene });
            const object = new this(template);
            return object;
        }

        activatePreviewListeners(initialLayer) {
            return new Promise((resolve) => {
                const handlers = {};

                const pfStyle = game.settings.get("pf1", "measureStyle") === true;

                const _clear = () => {
                    if (this.destroyed) return;
                    this.destroy();
                };

                const throttleRefresh = throttle(() => {
                    this.refresh();
                    canvas.app.render();
                }, this.constructor.RENDER_THROTTLE);

                // Update placement (mouse-move)
                handlers.mm = (event) => {
                    event.stopPropagation();
                    const center = event.data.getLocalPosition(this.layer);

                    if(isHexGrid(canvas.grid.type)) {
                        const [centerX, centerY] = canvas.grid.getCenter(center.x, center.y);
                        this.document.x = centerX;
                        this.document.y = centerY;
                    }
                    else {
                        const pos = canvas.grid.getSnappedPosition(center.x, center.y, 2);
                        this.document.x = pos.x;
                        this.document.y = pos.y;
                    }

                    throttleRefresh();
                };

                // Cancel the workflow (right-click)
                handlers.rc = (event, canResolve = true) => {
                    event.preventDefault();
                    event.stopPropagation();

                    this.layer.preview.removeChildren();
                    canvas.stage.off("mousemove", handlers.mm);
                    canvas.stage.off("mousedown", handlers.lc);
                    canvas.app.view.removeEventListener("contextmenu", handlers.rc);
                    canvas.app.view.removeEventListener("wheel", handlers.mw);
                    // Clear highlight
                    this.active = false;
                    const hl = canvas.grid.getHighlightLayer(this.highlightId);
                    hl.clear();
                    _clear();

                    initialLayer.activate();
                    if (canResolve) resolve({result: false});
                };

                // Confirm the workflow (left-click)
                handlers.lc = async (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    handlers.rc(event, false);

                    // Create the template
                    const result = {
                        result: this.document.distance != 0, // Only if template size is creater than 0
                        place: async () => {
                            const [doc] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [
                                this.document.toObject(false),
                            ]);
                            this.document = doc;
                            return doc;
                        },
                        delete: () => {
                            return this.document.delete();
                        },
                    };
                    _clear();
                    resolve(result);
                };

                // Rotate the template by 3 degree increments (mouse-wheel)
                handlers.mw = (event) => {
                    event.preventDefault(); // Prevent browser zoom
                    event.stopPropagation(); // Prevent other handlers

                    let delta, snap;
                    if (event.ctrlKey) {
                        delta = canvas.dimensions.distance * -Math.sign(event.deltaY);
                        this.document.distance += delta;
                        if (this.document.distance < 0) this.document.distance = 0;
                    } else {
                        if (pfStyle && this.document.t === "cone") {
                            delta = 120;
                            snap = isHexGrid(canvas.grid.type) ? 60 : (event.shiftKey ? delta : 45);
                        } else {
                            delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
                            snap = isHexGrid(canvas.grid.type) ? 60 : event.shiftKey ? delta : 5;
                        }
                        if (this.document.t === "rect") {
                            snap = Math.sqrt(Math.pow(5, 2) + Math.pow(5, 2));
                            this.document.distance += snap * -Math.sign(event.deltaY);
                        } else {
                            this.document.direction += snap * Math.sign(event.deltaY);
                        }
                    }

                    throttleRefresh();
                };

                // Activate listeners
                if (this.controlIcon) this.controlIcon.removeAllListeners();
                canvas.stage.on("mousemove", handlers.mm);
                canvas.stage.on("mousedown", handlers.lc);
                canvas.app.view.addEventListener("contextmenu", handlers.rc);
                canvas.app.view.addEventListener("wheel", handlers.mw);
                this.hitArea = new PIXI.Polygon([]);
            });
        }
    }
}