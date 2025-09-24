shipOrder = (id) => {
    sendConfirm('', 'Do you confirm to ship this order?').then(() => {
        fetch('/admin/update-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id, status: 'shipped'})
        })
            .then(response => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(() => {
                const btn = document.getElementById(`shipOrderBtn-${id}`)
                btn.disabled = true
                btn.textContent = 'Shipped'
                sendToast('text-success-emphasis', 'Process Successful', 'bi bi-check-square', 'The order has been successfully shipped.', () => {
                    location.reload()
                });
            })
            .catch(() => sendAlert('', 'Failed to ship order'));
    })
}

confirmDelivered = (id) => {
    sendConfirm('', 'Mark this order as delivered?').then(() => {
        fetch('/admin/update-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id, status: 'delivered' })
        })
            .then(response => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(() => {
                const btn = document.getElementById(`confirmDeliveredBtn-${id}`)
                btn.disabled = true
                btn.textContent = 'Delivered'
                sendToast('text-success-emphasis', 'Process Successful', 'bi bi-check-square', 'The order marked as delivered.', () => {
                    location.reload()
                });
            })
            .catch(() => sendAlert('', 'Failed to mark as delivered'));
    })
}

