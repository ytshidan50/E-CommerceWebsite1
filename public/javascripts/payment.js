$(`#checkout-form`).submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $(`#checkout-form`).serialize(),
        success: (paymentOrder) => {
            if (paymentOrder.CONFIRMED === true) {
                window.location.href = '/order-success'
            } else {
                createPayment(paymentOrder)
            }
        }
    })
})

createPayment = (paymentOrder) => {
    var options = {
        "key": 'rzp_test_MfdlLR1n2MubfG', // Enter the Key ID generated from the Dashboard
        // "amount": paymentOrder.amount, // Amount is in currency subunits. // Actually no need of this object. i think its fetching with the help of order id
        "currency": "INR",
        "name": "SHOPPING CART", //your business name
        "description": "Test Transaction",
        "image": "https://cdn.imgbin.com/16/3/18/imgbin-online-shopping-shopping-cart-logo-e-commerce-market-ZB0j7BGkzwjLHhMxSKi37nGKD.jpg",
        "order_id": paymentOrder.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (paymentResponse) {
            verifyPayment(paymentOrder, paymentResponse)
        },
        "prefill": paymentOrder.notes.contactDetails,
        // "notes": paymentOrder.notes,
        "theme": {
            "color": "#3399cc"
        }
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();

    rzp1.on('payment.failed', function (response) {
        window.location.href = '/order-failed'
        alert(
            `            errDescription: ${response.error.description}
            errSource: ${response.error.source}
            errStep: ${response.error.step}
            errReason: ${response.error.reason}
            order_id: ${response.error.metadata.order_id}
            payment_id: ${response.error.metadata.payment_id}`
        );
    });
}

verifyPayment = (paymentOrder, paymentResponse) => {
    $.ajax({
        url: '/verify-payment',
        method: 'post',
        contentType: 'application/json',     // send JSON
        data: JSON.stringify({ paymentOrder, paymentResponse }), // stringify your two objects
        success: (response) => {
            if (response.CONFIRMED === true) {
                window.location.href = '/order-success'
            } else {
                window.location.href = '/'
            }
        }
    })
}

continuePayment = (order) => {
    console.log(order)
    $.ajax({
        url: '/continue-payment',
        method: 'post',
        contentType: 'application/json',
        data: JSON.stringify(order),
        success: (paymentOrder) => {
            createPayment(paymentOrder)
        }
    })
}