const db = require('../config/connection');
const collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const { reject } = require('promise');

function toObjectId(id) {
    if (!ObjectId.isValid(id)) {
        return reject({ error: 'Invalid userId or productId', statusCode: 400 });
    }
    return new ObjectId(id);
}

const helper = {
    addToCart: (userId, productId, productName) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART).findOne({ userId: toObjectId(userId) });
            if (cart) {
                // let productIndex=cart.products.findIndex(product=>product.item==porductId)
                if (cart.products.some(product => product._id.equals(toObjectId(productId)))) {
                    db.get().collection(collection.CART).updateOne({ 'products._id': toObjectId(productId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then((result) => {
                        response.result = result
                        response.statusCode = 202
                        response.statusText = 'Product is already in the cart. Incremented'
                        resolve(response)
                    })
                } else {
                    db.get().collection(collection.CART).updateOne({ userId: toObjectId(userId) }, {
                        $push:
                            { products: { '_id': toObjectId(productId), 'quantity': 1, 'name': productName } }
                    }).then((result) => {
                        response.result = result
                        response.status = true
                        response.statusCode = 200
                        response.statusText = 'Successfully addedd to cart'
                        resolve(response)
                    });
                }
            } else {
                let newCart = {
                    userId: toObjectId(userId),
                    products: [{ '_id': toObjectId(productId), 'quantity': 1, 'name': productName }]
                }
                db.get().collection(collection.CART).insertOne(newCart).then((result) => {
                    response.result = result
                    response.status = true
                    response.statusCode = 201
                    response.statusText = 'Successfully created a cart'
                    resolve(response)
                })
            }
        })
    },

    removeFromCart: (userId, productId, force) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collection.CART).findOne({ 'userId': toObjectId(userId) })
            if (force == 'true') {
                if (cart.products.length > 1) {
                    db.get().collection(collection.CART).updateOne({
                        'userId': toObjectId(userId)
                    }, {
                        $pull: { 'products': { '_id': toObjectId(productId) } }
                    }).then(async (result) => {
                        response.result = result
                        response.status = true
                        response.statusCode = 200
                        response.statusText = 'Successfully removed the product from the cart'
                        resolve(response)
                    })
                } else {
                    db.get().collection(collection.CART).deleteOne({ 'userId': toObjectId(userId) }).then((result) => {
                        response.result = result
                        response.status = true
                        response.statusCode = 200
                        response.statusText = 'Successfully removed the product and deleted the cart'
                        resolve(response)
                    })
                }
            } else {
                if (cart.products.length > 1) {
                    const productIndex = await cart.products.findIndex(product => product._id == productId)
                    if (cart.products[productIndex].quantity <= 1) {
                        db.get().collection(collection.CART).updateOne({
                            'userId': toObjectId(userId)
                        }, {
                            $pull: { 'products': { '_id': toObjectId(productId) } }
                        }).then(async (result) => {
                            response.result = result
                            response.status = true
                            response.statusCode = 200
                            response.statusText = 'Successfully removed the product from the cart'
                            resolve(response)
                        })
                    } else {
                        db.get().collection(collection.CART).updateOne({
                            'userId': toObjectId(userId),
                            'products._id': toObjectId(productId)
                        }, {
                            $inc: { 'products.$.quantity': -1 }
                        }).then((result) => {
                            response.result = result
                            response.status = true
                            response.statusCode = 202
                            response.statusText = 'Successfully decremented the product'
                            resolve(response)
                        })
                    }
                } else {
                    if (cart.products[0].quantity <= 1) {
                        db.get().collection(collection.CART).deleteOne({ 'userId': toObjectId(userId) }).then((result) => {
                            response.result = result
                            response.status = true
                            response.statusCode = 200
                            response.statusText = 'Successfully removed the product and deleted the cart'
                            resolve(response)
                        })
                    } else {
                        db.get().collection(collection.CART).updateOne({
                            'userId': toObjectId(userId),
                            'products._id': toObjectId(productId)
                        }, {
                            $inc: { 'products.$.quantity': -1 }
                        }).then((result) => {
                            response.result = result
                            response.status = true
                            response.statusCode = 202
                            response.statusText = 'Successfully decremented the product'
                            resolve(response)
                        })
                    }
                }

            }
        })
    },

    getCartCount: async (userId) => {
        let cartCount = 0
        cart = await db.get().collection(collection.CART).findOne({ 'userId': toObjectId(userId) })
        if (cart) {
            return cart.products.length
        }
        return cartCount
    },

    getCart: (userId) => {
        response = {}
        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collection.CART).aggregate([
                { $match: { 'userId': toObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $lookup: {
                        localField: 'products._id',
                        from: collection.PRODUCT,
                        foreignField: '_id',
                        as: 'productDetails',
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $addFields: {
                        'productDetails.quantity': '$products.quantity',
                        'productDetails.subTotal': { $multiply: ['$productDetails.rate', '$products.quantity'] },
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        total: { $sum: '$productDetails.subTotal' },
                        products: { $push: '$productDetails' },
                        productIds: { $push: '$productDetails._id' },
                    }
                }
            ]).toArray()
            if (cart[0]) {
                response.cart = cart[0]
                response.status = true
            } else { response.status = false }
            resolve(response)
        });
    },

    placeOrder: (userId, orderDetails) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            response.COD = orderDetails.paymentMethod == 'COD' ? true : false
            const status = orderDetails.paymentMethod == 'COD' ? 'placed' : 'pending'
            const userCart = await db.get().collection(collection.CART).aggregate([
                { $match: { 'userId': toObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $lookup: {
                        from: collection.PRODUCT,
                        localField: 'products._id',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $group: {
                        '_id': '$_id',
                        'products': { $push: '$products' },
                        'totalItems': { $sum: '$products.quantity' },
                        'total': { $sum: { $multiply: ['$productDetails.rate', '$products.quantity'] } },
                    }
                }
            ]).toArray()
            if (userCart[0]) {
                let order = {
                    'userId': toObjectId(userId),
                    'status': status,
                    'totalItems': userCart[0].totalItems,
                    'total': userCart[0].total,
                    'payment': { 'method': orderDetails.paymentMethod, 'status': 'pending', },
                    'products': userCart[0].products,
                    'deliveryDetails': {
                        'mobile': orderDetails.mobile,
                        'address': orderDetails.address,
                        'pinCode': orderDetails.pinCode
                    },
                    'times': {
                        'ordered': new Date(),
                        'confirmed': status == 'placed' ? new Date() : undefined,
                    }
                }
                response.order = order
                db.get().collection(collection.ORDER).insertOne(order).then((result) => {
                    response.createOrderResult = result
                    if (result.acknowledged) {
                        db.get().collection(collection.CART).deleteOne({ 'userId': toObjectId(userId) }).then((result) => {
                            if (result.deletedCount == 1) {
                                response.deleteCartResult = result
                                response.status = true
                                response.statusCode = 200
                                response.statusText = 'Successfully created the order and deleted the cart'
                                resolve(response)
                            } else {
                                response.status = true
                                response.statusCode = 201
                                response.statusText = 'Successfully created the order'
                                resolve(response)
                            }
                        })
                    } else {
                        response.statusCode = 404
                        response.statusText = 'Something went wrong while creating the order'
                        resolve(response)
                    }
                })
            }
        })
    },

    updatePayment: (orderId, payment) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER).updateOne({ '_id': toObjectId(orderId) }, {
                $set:
                {
                    'payment': payment,
                    'status': payment.order.status == 'paid' ? 'placed' : 'pending',
                    'times.confirmed': payment.order.status == 'paid' ? new Date() : undefined
                }
            }).then((result) => {
                result.modifiedCount == 1 ? resolve(result) : reject(result)
            })
        })
    },

    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let query = userId == 'full' || 'all' || 'complete' ? {} : query = { 'userId': toObjectId(userId) }
            const orders = await db.get().collection(collection.ORDER).find(query).toArray()
            if (orders) {
                response.status = true
                response.orders = orders
                response.statusText = 'Successfully fetched order list'
                response.statusCode = 200
                resolve(response)
            } else {
                response.statusText = 'No order(s) for the user'
                response.statusCode = 404
                resolve(response)
            }
        })
    },

    getOrder: (userId, orderId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            const order = await db.get().collection(collection.ORDER).aggregate([
                { $match: { '_id': toObjectId(orderId), 'userId': toObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $lookup: {
                        'from': collection.PRODUCT,
                        'localField': 'products._id',
                        'foreignField': '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $addFields: {
                        'productDetails.quantity': '$products.quantity',
                        'productDetails.subTotal': { $multiply: ['$productDetails.rate', '$products.quantity'] }
                    }
                },
                {
                    $group: {
                        '_id': '$_id',
                        'userId': { $first: '$userId' },
                        'status': { $first: '$status' },
                        'totalItems': { $first: '$totalItems' },
                        'total': { $first: '$total' },
                        'payment': { $first: '$payment' },
                        'products': { $push: '$productDetails' },
                        'deliveryDetails': { $first: '$deliveryDetails' },
                        'times': { $first: '$times' },
                        'adminNote': { $first: '$adminNote' },
                    }
                },
            ]).toArray()
            if (order[0]) {
                response.order = order[0]
                response.statusText = 'Successfully fetched the order'
                response.statusCode = 200
                resolve(response)
            } else {
                response.statusText = 'No order(s) found'
                response.statusCode = 404
                resolve(response)
            }
        })
    },

    updateOrderNote: (orderId, note) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER).updateOne({ _id: toObjectId(orderId) }, { $set: { 'adminNote': note } }).then((result) => {
                if (result.acknowledged) {
                    result.modifiedCount == 1 ? resolve() : resolve('No edit found!')
                } else {
                    reject()
                }
            })
        })
    },

    updateOrder: (orderId, setData, userId) => {
        return new Promise((resolve, reject) => {
            // const updateFields = data.reduce((acc, curr) => {
            //     acc[curr.key] = curr.value;
            //     return acc;
            // }, {});
            const query = { _id: toObjectId(orderId) }
            if (userId) query.userId = toObjectId(userId)
            db.get().collection(collection.ORDER).updateOne(query,
                { $set: setData }
            ).then(result => {
                if (result.acknowledged) {
                    resolve()
                } else reject()
            })
        })
    }

}//  ^  You can add comma and start new function | module exports - Final enclosing

module.exports = helper;