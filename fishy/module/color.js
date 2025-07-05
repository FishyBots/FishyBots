

async function colorFunc(colorArg) {
    const colorMap = {
        "red": "#FF0000",
        "green": "#00FF00",
        "blue": "#0000FF",
        "black": "#000000",
        "white": "#FFFFFF",
        "pink": "#dc14eb",
        "purple": "#764686",
        "sown": "#e1adff",
        "inside": "#99fcff",
        "orange": "#FFA500",
        "yellow": "#FFFF00",
        "brown": "#A52A2A",
        "gris": "#808080",
        "argent": "#C0C0C0",
        "cyan": "#00FFFF",
        "lavande": "#E6E6FA",
        "corail": "#FF7F50",
        "beige": "#F5F5DC",
        "defaut": "#2b24ff"
    };

    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const lowerCaseColorArg = colorArg.toLowerCase();
    if (lowerCaseColorArg in colorMap) {
        const color = colorMap[lowerCaseColorArg];
        return color;
    } else if (colorRegex.test(colorArg)) {
        return colorArg;
    } else {
        return false;
    }
}

module.exports = { colorFunc };