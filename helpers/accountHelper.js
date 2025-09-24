const db = require('../config/connection');
const collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const text = require('text-case');
const { reject } = require('promise');

function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return reject({ error: 'Invalid userId or productId', statusCode: 400 });
  }
  return new ObjectId(id);
}

module.exports = {
    doSignUp: (userData) => {
        userData.email = text.lowerCase(userData.email)
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER).findOne({ email: userData.email });
            if (user) {
                response.status = false
                response.statusText = 'This mail id already used by another user.'
                response.user = user
                resolve(response);
            } else {
                userData.password = await bcrypt.hash(userData.password, 10);
                db.get().collection(collection.USER).insertOne(userData).then((result) => {
                    response.status = true
                    response.statusText = 'Successfully Registered'
                    response.user = userData
                    response.user._id = result.insertedId
                    resolve(response);
                })
            }
        })
    },

    doLogin: (userData) => {
        userData.email = text.lowerCase(userData.email)
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then(async (result) => {
                    if (result) {
                        response.status = true
                        response.statusCode = 200
                        response.statusText = 'Successfull Login'
                        response.user = user
                        resolve(response)
                    } else {
                        response.status = false
                        response.statusCode = 401
                        response.statusText = 'Password is invalid'
                        response.user = user
                        resolve(response)
                    }
                })
            } else {
                response.status = false
                response.statusCode = 404
                response.statusText = 'There is no account registered with this mail'
                response.user = userData
                resolve(response)
            }
        })
    },

    updateProfile: (userId, profileDetails) => {
        return new Promise((resolve, reject) => {
            console.log(userId)
            let response = {}
            db.get().collection(collection.USER).updateOne({ _id: toObjectId(userId) }, { $set: profileDetails }).then((result) => {
                profileDetails._id = toObjectId(userId)
                response.user = profileDetails
                response.result = result
                response.status = true
                response.statusCode = 200
                response.statusText = 'Successfully updated the profile'
                resolve(response)
            })
        })
    }
}//  ^  You can add comma and start new function | module exports - Final enclosing