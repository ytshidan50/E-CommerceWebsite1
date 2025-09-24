(function () {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggle');
    // Initialize theme: use saved or default from data-bs-theme
    let theme = localStorage.getItem('theme') || html.getAttribute('data-bs-theme');
    apply(theme);
    // Toggle on button click
    btn.addEventListener('click', () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        apply(theme);
    });
    function apply(t) {
        // Update attribute and class for Bootstrap and custom styling
        html.setAttribute('data-bs-theme', t);
        html.classList.toggle('dark', t === 'dark');
        html.classList.toggle('light', t === 'light');
        localStorage.setItem('theme', t);
        // Update button icon and tooltip
        if (t === 'dark') {
            btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            btn.title = 'Switch to Light';
        } else {
            btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            btn.title = 'Switch to Dark';
        }
    }
})();

addToCart = (productId, productName, loggedIn) => {
    if (loggedIn == 'true') {
        $.ajax({
            url: '/add-to-cart/' + productId + '/' + productName,
            method: 'get',
            success: (response) => {
                if (response.statusCode == 202) {
                    let rate = parseInt($(`#productRate-${productId}`).text())
                    let quantity = parseInt($(`#productQuantity-${productId}`).text()) + 1
                    let subTotal = parseInt($(`#productSubTotal-${productId}`).text()) + rate
                    let total = parseInt($(`#cartTotal`).text()) + rate
                    $(`#productQuantity-${productId}`).text(quantity)
                    $(`#productSubTotal-${productId}`).text(subTotal)
                    $(`#cartTotal`).text(total)
                    if (quantity <= 1) {
                        $(`#quantityDecBtn-${productId}`).prop('disabled', true)
                            .removeClass('btn-outline-primary')
                            .addClass('btn-outline-secondary')
                    } else {
                        $(`#quantityDecBtn-${productId}`).prop('disabled', false)
                            .removeClass('btn-outline-secondary')
                            .addClass('btn-outline-primary')
                    }
                } else if (response.status == true) {
                    $(`#cartBtn-${productId}`).prop('disabled', true).html('Added to cart')
                    let cartCount = parseInt($('#cartCount').text()) + 1
                    $('#cartCount').text(cartCount)
                }
            }
        })
    } else {
        window.location.href = '/login'
    }
}

removeFromCart = (productId, force, loggedIn) => {
    if (loggedIn == 'true') {
        $.ajax({
            url: '/remove-from-cart/' + productId + '/' + force,
            method: 'get',
            success: (response) => {
                if (response.statusCode == 202) {
                    let rate = parseInt($(`#productRate-${productId}`).text())
                    let quantity = parseInt($(`#productQuantity-${productId}`).text()) - 1
                    let subTotal = parseInt($(`#productSubTotal-${productId}`).text()) - rate
                    let total = parseInt($(`#cartTotal`).text()) - rate
                    $(`#productQuantity-${productId}`).text(quantity)
                    $(`#productSubTotal-${productId}`).text(subTotal)
                    $(`#cartTotal`).text(total)
                    if (quantity <= 1) {
                        $(`#quantityDecBtn-${productId}`).prop('disabled', true)
                            .removeClass('btn-outline-primary')
                            .addClass('btn-outline-secondary')
                    } else {
                        $(`#quantityDecBtn-${productId}`).prop('disabled', false)
                            .removeClass('btn-outline-secondary')
                            .addClass('btn-outline-primary')
                    }
                } else if (response.statusCode == 200) {
                    let cartCount = parseInt($('#cartCount').text()) - 1
                    $('#cartCount').text(cartCount)
                    location.reload()
                    // window.location.href = '/cart'
                }
            }
        })
    } else {
        window.location.href = '/login'
    }
}

updateDisplayImage = (event) => {
    document.getElementById('displayImage').src = URL.createObjectURL(event.target.files[0])
}

$(document).ready(function () {
    $('.datatable').DataTable();
});

goTo = (location) => {
    window.location.href = location
}

sendToast = (type, title, icon, message, callback) => {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    const toastHTML =
        `<div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="me-2 ${icon} ${type}"></i>
                <strong class="me-auto ${type}">${title}</strong>
                <small>now</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>`
    toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
    const newToast = document.getElementById(toastId);
    const toast = new bootstrap.Toast(newToast);
    toast.show();
    // Clean up after toast hides
    newToast.addEventListener('hidden.bs.toast', () => {
        newToast.remove();
        callback()
    });
}

sendAlert = (title, message) => {
    const modalEl = document.getElementById('modal')
    modalEl.innerHTML =
        `<div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <!-- <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button> 
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div> -->
            </div>
        </div>`
    const modal = new bootstrap.Modal(modalEl)
    modal.show()
}

sendConfirm = (title, message) => {
    return new Promise((resolve, reject) => {
        const modalEl = document.getElementById('modal')
        modalEl.innerHTML =
            `<div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button> 
                    <button type="button" class="btn btn-primary" id="modalConfirm">Confirm</button>
                </div>
            </div>
        </div>`
        const modal = new bootstrap.Modal(modalEl)
        modal.show()

        const btn = document.getElementById('modalConfirm')
        btn.addEventListener('click', () => {
            modal.hide()
            resolve()
        })
    })
}

showAlert = (type, message) => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')
    alertPlaceholder.append(wrapper)
}