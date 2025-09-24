var express = require('express');
var router = express.Router();

const userHelper = require('../helpers/userHelper');
const productHelper = require('../helpers/productHelper');
const paymentHelper = require('../helpers/paymentHelper');

const verifyLogin = (req, res, next) => {
  req.session.recentUrl = req.originalUrl
  if (req.session.loggedIn) {
    req.session.adminHeader = undefined
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', (req, res, next) => {
  req.session.adminHeader = undefined
  productHelper.getAllProducts().then(async (products) => {
    if (req.session.user) {
      req.session.user.cartCount = await userHelper.getCartCount(req.session.user._id)
      userHelper.getCart(req.session.user._id).then(async (response) => {
        res.render('user/home', { req, products, cart: response.cart });
      })
    } else {
      res.render('user/home', { products, req });
    }
  })
});

router.get('/cart', verifyLogin, (req, res, next) => {
  userHelper.getCart(req.session.user._id).then(async (response) => {
    req.session.user.cartCount = await userHelper.getCartCount(req.session.user._id)
    res.render('user/cart', { req, cart: response.cart });
  })
});

router.get('/add-to-cart/:id/:name', async (req, res, next) => {
  userHelper.addToCart(req.session.user._id, req.params.id, req.params.name).then((response) => {
    res.json(response)  // edited from {response}  to response same as /cart and on scripts too
  })
});

router.get('/remove-from-cart/:id/:force', async (req, res, next) => {
  userHelper.removeFromCart(req.session.user._id, req.params.id, req.params.force).then((response) => {
    res.json(response)
  })
});

router.get('/place-order', verifyLogin, async (req, res) => {
  const response = await userHelper.getCart(req.session.user._id)
  if (response.cart) {
    req.session.user.cartCount = response.cart.productIds.length
    res.render('user/placeOrder', { req, cart: response.cart })
  } else {
    res.redirect('/cart')
  }
});

router.post('/place-order', verifyLogin, async (req, res) => {
  userHelper.placeOrder(req.session.user._id, req.body).then((response) => {
    response.order.contactDetails = { "name": req.session.user.fullName, "email": req.session.user.email, "contact": req.session.user.mobile || req.body.mobile }
    req.session.successOrder = response.order
    if (response.COD) {
      res.json({ CONFIRMED: true })
    } else {
      paymentHelper.getPaymentOrder(response.order).then((paymentOrder) => {
        let payment = { order: paymentOrder, method: response.order.payment.method, status: 'pending' }
        userHelper.updatePayment(response.order._id, payment).then((orderUpdateResult) => {
          res.json(paymentOrder)
        })
      }).catch((err) => {
        console.log('Error: ' + err) //need to add error handling and continue payment if the status is pending in orders
      })
    }
  })
});

router.post('/continue-payment', verifyLogin, (req, res) => {
  let order = req.body
  order.contactDetails = { "name": req.session.user.fullName, "email": req.session.user.email, "contact": req.session.user.mobile || req.body.deliveryDetails.mobile }
  paymentHelper.getPaymentOrder(order).then((paymentOrder) => {
    let payment = order.payment
    payment.order = paymentOrder
    userHelper.updatePayment(order._id, payment).then((orderUpdateResult) => {
      req.session.successOrder = order
      res.json(paymentOrder)
    })
  }).catch((err) => {
    console.log('Error: ' + err) //need to add error handling and continue payment if the status is pending in orders
  })
})

router.post('/verify-payment', verifyLogin, (req, res) => {
  paymentHelper.verifyPayment(req.body.paymentOrder.id, req.body.paymentResponse).then((paymentOrder) => {
    console.log('Updated order after payment verification\n' + paymentOrder)
    let payment = {
      'method': 'ONLINE',
      'status': paymentOrder.status == 'created' ? 'pending' : paymentOrder.status == 'paid' ? 'completed' : paymentOrder.status,
      order: { id: paymentOrder.id, status: paymentOrder.status },
      response: { id: req.body.paymentResponse.razorpay_payment_id }
    }
    userHelper.updatePayment(paymentOrder.receipt, payment).then((orderUpdateResult) => {
      res.json({ CONFIRMED: true })
    }).catch((err) => { console.log(err) })
  }).catch((err) => { console.log(err) })
})

router.get('/order-success', verifyLogin, (req, res) => {
  if (req.session.successOrder) {
    res.render('user/orderSuccess', { req, order: req.session.successOrder })
    req.session.successOrder = undefined
  } else {
    res.redirect('/');
  }
})

router.get('/order-failed', verifyLogin, (req, res) => {
  if (req.session.successOrder) {
    res.render('user/orderFailed', { req, order: req.session.successOrder })
    req.session.successOrder = undefined
  } else {
    res.redirect('/');
  }
})

router.get('/orders', verifyLogin, (req, res) => {
  userHelper.getOrders(req.session.user._id).then((response) => {
    res.render('user/orders', { req, orders: response.orders })
  })
})

router.get('/order/:id', verifyLogin, (req, res) => {
  userHelper.getOrder(req.session.user._id, req.params.id).then((response) => {
    res.render('user/order', { req, order: response.order })
  })
})

router.post('/cancel-order',verifyLogin,(req,res)=>{
  
  const setData = {
    'status': 'cancelled',
    [`times.cancelled`]: new Date()
  }
  userHelper.updateOrder(req.body.orderId,setData,req.session.user._id).then(()=>{

  }).catch(()=>{
    
  })
})
module.exports = router;