const { resolve } = require('path')
const { RAZORPAY } = require('../config/payment')
const Razorpay = require('razorpay')

const instance = new Razorpay({ key_id: RAZORPAY.KEY, key_secret: RAZORPAY.SECRET })

module.exports = {
    getPaymentOrder: (order) => {
        return new Promise(async (resolve, reject) => {
            let paymentOrder
            if(order.onlinePayment?.order?.id != undefined){
                paymentOrder = await instance.orders.fetch(order.onlinePayment.order.id)
            }else{
                paymentOrder = await instance.orders.create({
                    amount: order.total * 100,
                    currency: "INR",
                    receipt: order._id,
                    notes: {
                        totalItems: order.totalItems,
                        userId: order.userId,
                        accountEmail: order.contactDetails.email,
                        deliveryMobile: order.deliveryDetails.mobile,
                        deliveryAddress: order.deliveryDetails.address,
                        deliveryPinCode: order.deliveryDetails.pinCode,
                    }
                })
            }
            if (paymentOrder.error) { reject(new Error(JSON.stringify(paymentOrder.error))) }
            else { resolve(paymentOrder) }
        })
    },

    verifyPayment: (orderId, paymentResponse) => {
        return new Promise(async (resolve, reject) => {
            const crypto = require('crypto')
            let expectedSignature = crypto.createHmac('sha256', RAZORPAY.SECRET)
                .update(orderId + '|' + paymentResponse.razorpay_payment_id)
                .digest('hex');
            if (expectedSignature === paymentResponse.razorpay_signature) {
                let paymentOrder = await instance.orders.fetch(orderId)
                if (paymentOrder.error) { reject(new Error(JSON.stringify(paymentOrder.error))) }
                else { resolve(paymentOrder) }
            } else { reject(new Error('Signature Mismatch'))}
        })
    }
}