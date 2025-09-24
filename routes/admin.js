var express = require('express');
var router = express.Router();

const productHelper = require('../helpers/productHelper');
const userHelper = require('../helpers/userHelper');
const { ObjectId } = require('mongodb');

const verifyLogin = (req, res, next) => {
  req.session.recentUrl = req.originalUrl
  if (req.session.loggedIn) {
    if (req.session.user.admin === true) {
      req.session.adminHeader = true;
      next()
    }
    else {
      res.redirect('/')
    }
  } else {
    res.redirect('/login')
  }
}

function validateId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    if (!ObjectId.isValid(id)) {
      return res.status(400).render('error', {
        message: `Invalid ${paramName} format`,
        error: { status: 400 }
      });
    }
    next();
  };
}

/* GET users listing. */
router.get('/', verifyLogin, function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render('admin/viewProducts', { products, req });
  });
});

router.get('/add-product', verifyLogin, (req, res, next) => {
  res.render('admin/addProduct', { req });
});

router.post('/add-product', verifyLogin, (req, res, next) => {
  req.body.rate = parseInt(req.body.rate)
  productHelper.addProduct(req.body, req.files.image, (response) => {
    if (response.status) {
      res.redirect('/admin')
    } else {
      res.redirect('/admin/add-product')
    }
  })
});

router.post('/delete-product', verifyLogin, (req, res) => {
  productHelper.deleteProduct(req.body.productId).then((response) => {
    if (response.status) {
      res.json(response)
    } else {
      res.json()
    }
  });
});

router.get('/edit-product/:id', verifyLogin, (req, res) => {
  productHelper.getProductDetails(req.params.id).then((response) => {
    if (response.status) {
      res.render('admin/editProduct', { product: response.product, req })
    } else {
      res.send(response.product)
    }
  })
})

router.post('/edit-product', verifyLogin, (req, res) => {
  req.body.rate = parseInt(req.body.rate)
  const image = req.files ? req.files.image : false;
  productHelper.updateProduct(req.body.id, req.body, image).then((response) => {
    res.json(response)
  })
});

router.get('/full-orders', verifyLogin, (req, res) => {
  userHelper.getOrders('full').then((response) => {
    if (response.status) {
      res.render('admin/fullOrders', { req, orders: response.orders })
    }
  })
})

router.get('/order/:userId/:id', verifyLogin, (req, res) => {
  userHelper.getOrder(req.params.userId, req.params.id).then((response) => {
    res.render('admin/viewOrder', { req, order: response.order })
  })
})

router.post('/update-note', verifyLogin, (req, res) => {
  let response = {}
  userHelper.updateOrderNote(req.body.orderId, req.body.note)
    .then((message) => {
      if (message) {
        response.toastType = 'text-warning-emphasis'
        response.toastTitle = 'Update Failed'
        response.toastIcon = `bi bi-exclamation-square`
        response.toastMessage = `There is no edit to update!`
        res.json(response)
      } else {
        response.toastType = 'text-success-emphasis'
        response.toastTitle = 'Updated Successfull'
        response.toastIcon = `bi bi-check-square`
        response.toastMessage = `Updated to:\n${req.body.note}`
        res.json(response)
      }
    })
    .catch(() => {
      response.toastType = 'text-danger-emphasis'
      response.toastTitle = 'Update Failed'
      response.toastIcon = `bi bi-x-square`
      response.toastMessage = `Something went wrong while updating the admin note!`
      res.json(response)
    })
})

router.post('/update-order-status', verifyLogin, (req, res) => {
  let response = {}
  const setData = {
    'status': req.body.status,
    [`times.${req.body.status}`]: new Date()
  }
  userHelper.updateOrder(req.body.orderId, setData).then(() => {
    response.ok = true
    response.toastType = 'text-success-emphasis'
    response.toastTitle = 'Status Updated'
    response.toastIcon = `bi bi-check-square`
    response.toastMessage = `Updated to:\n${req.body.status}`
    res.json(response)
  })
    .catch(() => {
      res.json()
    })
})

module.exports = router;