document
    .getElementById('country')
    .addEventListener('change', async function (event) {
        getStates(event);
    });

async function getStates(event) {
    let finalStates;
    let jsonStates;
    try {
        const returnedStates = await fetch(
            '/options/getStates?country=' + event.target.value
        );
        jsonStates = await returnedStates.json();
        states = jsonStates.data;
    } catch (e) {
        alert(e);
        throw new Error(e);
    }

    let html = '';
    for (let state of states) {
        html += '<option value="' + state._id + '">' + state.name + '</option>';
    }

    document.getElementById('state').innerHTML = html;
}
