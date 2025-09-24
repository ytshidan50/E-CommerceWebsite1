const db = require('../config/connection');
const collection = require('../config/collection');
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs')
const path = require('path');
const { reject } = require('promise');

function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return reject({ error: 'Invalid id', statusCode: 400 });
  }
  return new ObjectId(id);
}

module.exports = {
    addProduct: (product, image, callback) => {
        let response = {}
        db.get().collection(collection.PRODUCT).insertOne(product).then((result) => {
            const id = result.insertedId.toString();
            response.id = id
            image.mv('./public/productImages/' + id + '.png', (err) => {
                if (err) {
                    response.statusText = err
                    callback(response)
                } else {
                    response.status = true
                    response.statusText = "Successfully Uploaded"
                    callback(response)
                }
            })
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT).find().toArray()
            resolve(products);
        })
    },

    deleteProduct: (productId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT).findOne({ _id: toObjectId(productId) });
            if (product) {
                const imagePath = path.join(__dirname, '../public', 'productImages', `${productId}.png`)
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        response.statusCode = 500
                        response.statusText = err
                        resolve(response)
                    } else {
                        db.get().collection(collection.PRODUCT).deleteOne({ _id: toObjectId(productId) }).then((result) => {
                            response.status = true
                            response.result = result
                            response.statusText = 'Product and image was deleted successfully'
                            resolve(response)
                        })
                    }
                })
            } else {
                response.statusCode = 404
                response.statusText = 'Product not found'
                resolve(response)
            }
        })
    },

    getProductDetails: (productId) => {
        response = {}
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT).findOne({ _id: toObjectId(productId) })
            if (product) {
                response.status = true
                response.statusText = 'Details fetched successfully'
                response.product = product
                resolve(response)
            } else {
                const imagePath = path.join(__dirname, '../public', 'productImages', `${productId}.png`)
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        response.statusCode = 403
                        response.statusText = 'No products and its image found'
                        resolve(response)
                    } else {
                        response.statusCode = 404
                        response.statusText = 'Product not found'
                        resolve(response)
                    }
                })
            }

        });
    },

    updateProduct: (productId, product, image) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let isProductAvailable = await db.get().collection(collection.PRODUCT).findOne({ _id: toObjectId(productId) })
            if (isProductAvailable) {
                db.get().collection(collection.PRODUCT).updateOne({ _id: toObjectId(productId) }, {
                    $set: {
                        name: product.name,
                        description: product.description,
                        category: product.category,
                        rate: product.rate
                    }
                }).then((result) => {
                    response.result = result
                    if (image) {
                        image.mv(`./public/productImages/${productId}.png`, (err) => {
                            if (err) {
                                response.statusCode = 500
                                response.statusText = 'Can not replace image'
                                response.imageUpdateErr
                                resolve(response)
                            } else {
                                response.status = true
                                response.statusText = 'Product and its image has been successfully updated'
                                resolve(response)
                            }
                        })
                    } else {
                        response.status = true
                        response.statusText = 'Product has been successfully updated'
                        resolve(response)
                    }
                })
            } else {
                response.statusCode = 404
                response.statusText = 'Product not found'
                resolve(response)
            }
        })
    }
}//  ^  You can add comma and start new function | module exports - Final enclosing