function getQueryStringValues(key) {
    let arrParamValues = [];
    const url = window.location.href
        .slice(window.location.href.indexOf('?') + 1)
        .split('&');
    for (let i = 0; i < url.length; i++) {
        let arrParamInfo = url[i].split('=');
        if (arrParamInfo[0] == key || arrParamInfo[0] == key + '[]') {
            arrParamValues.push(decodeURIComponent(urlparam[1]));
        }
    }
    return arrParamValues.length > 0
        ? arrParamValues.length == 1
            ? arrParamValues[0]
            : arrParamValues
        : null;
}
