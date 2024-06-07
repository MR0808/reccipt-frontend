const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.querySelectorAll('#deleteModalLink').forEach((link) =>
    link.addEventListener('click', (event) => {
        const btn = event.target; // Get the button that was clicked
        const businessId =
            btn.parentNode.parentNode.querySelector('[name=businessId]').value;
        document.getElementById('deleteBusinessId').value = businessId;
        const businessName = btn.parentNode.parentNode.querySelector(
            '[name=businessName]'
        ).value;
        document.getElementById('modalBusinessName').textContent = businessName;
        deleteModal.show();
    })
);

document
    .getElementById('modalDeleteBtn')
    .addEventListener('click', function (event) {
        deleteBusiness();
    });

async function deleteBusiness() {
    const businessId = document.getElementById('deleteBusinessId').value;
    try {
        await fetch('/businesses/remove/' + businessId, {
            method: 'DELETE'
        });
        location.reload();
    } catch (err) {
        console.log(err);
    }
}
