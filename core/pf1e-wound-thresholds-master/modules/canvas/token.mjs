export function extendToken(Token) {
    return class WoundThresholdToken extends Token {
        getBarLeftSegment(data, barNumber) {
            switch (data.attribute) {
                case "attributes.vigor":
                    const maxValue = Number(this.actor.system.attributes.wounds.max);
                    const currentValue = Number(this.actor.system.attributes.wounds.value);

                    return {
                        value: currentValue,
                        color: this._getColor(currentValue, maxValue, barNumber),
                        max: maxValue
                    };

                default:
                    return {
                        value: 0,
                        max: 0,
                        color: 0x000000
                    };
            }
        }

        getBarRightSegment(data, barNumber) {
            switch (data.attribute) {
                case "attributes.hp":
                    return {
                        value: this.actor.system.attributes.hp.temp,
                        color: 0xc0d6e4,
                        max: this.actor.system.attributes.hp.temp
                    };
                case "attributes.vigor":
                    return {
                        value: this.actor.system.attributes.vigor.temp,
                        color: 0xc0d6e4,
                        max: this.actor.system.attributes.vigor.temp
                    };
                default:
                    return {
                        value: 0,
                        max: 0,
                        color: 0x000000
                    };
            }
        }

        _getColor(currentValue, maxValue, barNumber = 0, fade = 0) {
            const currentPercentage = Math.clamp(currentValue, 0, maxValue) / maxValue;

            switch (barNumber) {
                case 0:
                    return Color.fromRGBvalues(1 - currentPercentage / 2, currentPercentage, fade);

                default:
                    return Color.fromRGBvalues(0.5 * currentPercentage, 0.7 * currentPercentage, (0.5 + currentPercentage / 2));
            }
        }

        _getBarBaseSegment(data, barNumber) {
            let multiplier = 0;
            switch (data.attribute) {
                case "attributes.vigor":
                    multiplier = 0.25;
                    break;

                default:
                    break;
            }

            return {
                value: data.value,
                max: data.max,
                color: this._getColor(data.value, data.max, barNumber, multiplier)
            }
        }

        _drawSegment(bar, style, segment, data, offset) {
            if (!segment?.value) {
                return;
            }

            const barEnd = Math.clamp(segment.value + offset, 0, data.max) / data.max;
            bar
                .beginFill(segment.color, 1.0)
                .lineStyle(style.borderWidth, 0x000000, 1.0)
                .drawRoundedRect(0, 0, barEnd * style.barWidth, style.barHeight, 2);

            style.offset += segment.value;
        }

        _drawBorder(bar, style) {
            bar.beginFill(0x000000, 0.5)
                .lineStyle(style.borderWidth, 0x000000, 1.0)
                .drawRoundedRect(0, 0, style.barWidth, style.barHeight, 3);
        }

        _drawBar(number, bar, data) {
            if(data.attribute === "attributes.wounds") {
                // Don't draw wounds bar
                return;
            }

            const black = 0x000000;

            // Get boost value (such as temporary hit points
            const leftSegment = this.getBarLeftSegment(data, number);
            const rightSegment = this.getBarRightSegment(data, number);
            const bottomSegment = this._getBarUnderline(data);
            const baseSegment = this._getBarBaseSegment(data, number);

            data.max = Math.max(data.max, rightSegment.max + baseSegment.max + leftSegment.max);

            const barHeight = Math.max(canvas.dimensions.size / 12, 8) * (this.document.height >= 2 ? 1.6 : 1);
            let barStyle = {
                barHeight: barHeight,
                barWidth: this.w,
                borderWidth: Math.clamp(barHeight / 8, 1, 2)
            }

            // Draw the bar
            bar.clear();
            bar.beginFill(0x000000, 0.5)
                .lineStyle(barStyle.borderWidth, 0x000000, 1.0)
                .drawRoundedRect(0, 0, barStyle.barWidth, barStyle.barHeight, 3);

            this._drawBorder(bar, barStyle);

            this._drawSegment(bar, barStyle, rightSegment, data, leftSegment.value + baseSegment.value);
            this._drawSegment(bar, barStyle, baseSegment, data, leftSegment.value);
            this._drawSegment(bar, barStyle, leftSegment, data, 0);

            // Bottom Bar
            this._drawSegment(bar, {
                barHeight: barStyle.barHeight / 2,
                barWidth: barStyle.barWidth,
                borderWidth: barStyle.borderWidth,
                offset: 0
            }, bottomSegment, data);

            // Set position
            const posY = number === 0 ? this.h - barHeight : 0;
            bar.position.set(0, posY);
        }
    }
}